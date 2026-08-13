import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AuthContext } from "@/lib/auth/authorization";
import { qcKabupatenScope } from "@/lib/auth/authorization";
import { createSchedule } from "@/features/schedules/services/schedule-service";
import { createNotification } from "@/features/notifications/services/notification-service";
import { dateString } from "@/lib/utils/date";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { LandProposal, LandProposalPhoto, LandProposalStatus } from "@/types";
import crypto from "node:crypto";
import sharp from "sharp";

const PROPOSAL_SELECT =
  "*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), proposed_by_user:users!land_proposals_proposed_by_fkey(name), reviewed_by_user:users!land_proposals_reviewed_by_fkey(name), created_schedule:schedules!land_proposals_created_schedule_id_fkey(id, visit_date), land_proposal_photos(id, url, caption, file_size, mime_type, created_at)";

const PHOTO_SIGN_TTL_SECONDS = 60 * 60;

function reviewAccess(ctx: AuthContext, kabupatenId: string): boolean {
  if (ctx.role === "admin") return true;
  const scope = qcKabupatenScope(ctx);
  if (scope === null) return false;
  return scope.includes(kabupatenId);
}

export async function listLandProposals(ctx: AuthContext): Promise<LandProposal[]> {
  const admin = createAdminClient();
  let query = admin.from("land_proposals").select(PROPOSAL_SELECT);

  if (ctx.role === "produksi") {
    query = query.eq("proposed_by", ctx.userId);
  } else if (ctx.role === "qc") {
    const scope = qcKabupatenScope(ctx) ?? [];
    query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
  }

  const { data, error } = await query.is("deleted_at", null).order("created_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as LandProposal[];
  return Promise.all(rows.map(withSignedPhotos));
}

export async function getLandProposal(id: string, ctx: AuthContext): Promise<LandProposal> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("land_proposals")
    .select(PROPOSAL_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Pengajuan tidak ditemukan");
  if (!(await canViewProposal(data as LandProposal, ctx))) {
    throw new Error("Tidak memiliki akses ke pengajuan ini");
  }
  return withSignedPhotos(data as LandProposal);
}

async function withSignedPhotos(proposal: LandProposal): Promise<LandProposal> {
  const raw = proposal as LandProposal & { land_proposal_photos?: LandProposalPhoto[] };
  const photos = raw.land_proposal_photos ?? [];
  const signed = await Promise.all(
    photos.map(async (p) => ({ ...p, url: await signPhotoUrl(p.url) })),
  );
  const rest: LandProposal = { ...raw };
  delete (rest as unknown as { land_proposal_photos?: LandProposalPhoto[] }).land_proposal_photos;
  return { ...rest, photos: signed };
}

async function signPhotoUrl(objectPath: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("land-proposal-photos")
      .createSignedUrl(objectPath, PHOTO_SIGN_TTL_SECONDS);
    return data?.signedUrl ?? "";
  } catch (e) {
    logger.error("land-proposal-service: failed to sign photo URL", {
      objectPath,
      error: String(e),
    });
    return "";
  }
}

async function canViewProposal(proposal: LandProposal, ctx: AuthContext): Promise<boolean> {
  if (ctx.role === "admin") return true;
  if (ctx.role === "produksi") return proposal.proposed_by === ctx.userId;
  const scope = qcKabupatenScope(ctx);
  if (scope === null) return false;
  return scope.includes(proposal.kabupaten_id);
}

export interface LandProposalData {
  kabupaten_id: string;
  kecamatan_id: string;
  desa_id: string;
  block_no?: string;
  no_plot?: string;
  document_no?: string;
  member_name?: string;
  cgr?: string;
  cgr_code?: string;
  nis?: string;
  ph_tanah?: number;
  real_tanam_ha?: number;
  detaseling?: string;
  tgl_tanam?: string;
  rencana_panen?: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
}

export async function createLandProposal(data: LandProposalData, ctx: AuthContext): Promise<LandProposal> {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("land_proposals")
    .insert({ ...data, proposed_by: ctx.userId, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return result as LandProposal;
}

export async function updateLandProposal(
  id: string,
  data: LandProposalData,
  ctx: AuthContext,
): Promise<LandProposal> {
  const proposal = await getLandProposal(id, ctx);

  const isOwner = proposal.proposed_by === ctx.userId;
  const isAdmin = ctx.role === "admin";

  if (!isOwner && !isAdmin) throw new Error("Hanya pengaju atau admin yang dapat mengubah pengajuan");
  if (isOwner && proposal.status !== "pending") {
    throw new Error("Hanya pengajuan pending yang dapat diubah");
  }
  if (isAdmin && proposal.status !== "pending" && proposal.status !== "rejected") {
    throw new Error("Admin hanya dapat mengubah pengajuan pending atau ditolak");
  }

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { ...data };
  if (isAdmin && proposal.status === "rejected") {
    // Admin memperbaiki data pengajuan yang ditolak -> masuk antrean review lagi.
    patch.status = "pending";
    patch.review_note = null;
    patch.reviewed_by = null;
  }
  const { data: result, error } = await admin
    .from("land_proposals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result as LandProposal;
}

export async function cancelLandProposal(id: string, ctx: AuthContext): Promise<void> {
  const proposal = await getLandProposal(id, ctx);
  if (proposal.proposed_by !== ctx.userId) throw new Error("Hanya pengaju yang dapat membatalkan pengajuan");
  if (proposal.status !== "pending") throw new Error("Hanya pengajuan pending yang dapat dibatalkan");

  const admin = createAdminClient();
  const { error } = await admin
    .from("land_proposals")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw error;
}

export async function approveLandProposal(id: string, ctx: AuthContext): Promise<LandProposal> {
  const proposal = await getLandProposal(id, ctx);
  if (!reviewAccess(ctx, proposal.kabupaten_id)) {
    throw new Error("Tidak memiliki akses untuk menyetujui pengajuan ini");
  }
  if (proposal.status !== "pending") throw new Error("Hanya pengajuan pending yang dapat disetujui");

  let scheduleId: string;
  try {
    const schedule = await createSchedule({
      user_id: ctx.userId,
      kabupaten_id: proposal.kabupaten_id,
      kecamatan_id: proposal.kecamatan_id,
      desa_id: proposal.desa_id,
      visit_date: dateString(new Date()),
      notes: proposal.notes ?? undefined,
      cgr: proposal.cgr ?? undefined,
      cgr_code: proposal.cgr_code ?? undefined,
      block_no: proposal.block_no ?? undefined,
      no_plot: proposal.no_plot ?? undefined,
      member_name: proposal.member_name ?? undefined,
      document_no: proposal.document_no ?? undefined,
      nis: proposal.nis ?? undefined,
      ph_tanah: proposal.ph_tanah ?? undefined,
      real_tanam_ha: proposal.real_tanam_ha ?? undefined,
      detaseling: proposal.detaseling ?? undefined,
      tgl_tanam: proposal.tgl_tanam ?? undefined,
      rencana_panen: proposal.rencana_panen ?? undefined,
      status: "pending",
    });
    scheduleId = schedule.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("idx_schedules_plot_unique")) {
      throw new Error("Plot ini sudah terdaftar sebagai jadwal aktif");
    }
    throw err;
  }

  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("land_proposals")
    .update({
      status: "approved",
      reviewed_by: ctx.userId,
      created_schedule_id: scheduleId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await notifyProposalReviewed(proposal.proposed_by, true, proposal.kabupaten?.name);
  return result as LandProposal;
}

export async function rejectLandProposal(id: string, reviewNote: string, ctx: AuthContext): Promise<LandProposal> {
  const proposal = await getLandProposal(id, ctx);
  if (!reviewAccess(ctx, proposal.kabupaten_id)) {
    throw new Error("Tidak memiliki akses untuk menolak pengajuan ini");
  }
  if (proposal.status !== "pending") throw new Error("Hanya pengajuan pending yang dapat ditolak");

  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("land_proposals")
    .update({ status: "rejected", reviewed_by: ctx.userId, review_note: reviewNote })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await notifyProposalReviewed(proposal.proposed_by, false, proposal.kabupaten?.name);
  return result as LandProposal;
}

export async function assignPetugas(
  proposalId: string,
  newUserId: string,
  ctx: AuthContext,
): Promise<void> {
  const proposal = await getLandProposal(proposalId, ctx);
  if (!reviewAccess(ctx, proposal.kabupaten_id)) {
    throw new Error("Tidak memiliki akses untuk menugaskan petugas");
  }
  if (proposal.status !== "approved" || !proposal.created_schedule_id) {
    throw new Error("Pengajuan harus disetujui terlebih dahulu");
  }

  const admin = createAdminClient();
  const { data: petugas, error: petugasError } = await admin
    .from("users")
    .select("role")
    .eq("id", newUserId)
    .eq("is_active", true)
    .maybeSingle();

  if (petugasError) throw petugasError;
  if (!petugas || petugas.role !== "produksi") {
    throw new Error("Petugas harus ber-role produksi");
  }

  const { error } = await admin
    .from("schedules")
    .update({ user_id: newUserId })
    .eq("id", proposal.created_schedule_id);

  if (error) throw error;
}

// ---------- Photos ----------

function canManagePhotos(proposal: LandProposal, ctx: AuthContext): boolean {
  if (ctx.role === "admin") return true;
  return proposal.proposed_by === ctx.userId && proposal.status === "pending";
}

export async function uploadLandProposalPhoto(
  proposalId: string,
  file: File,
  ctx: AuthContext,
): Promise<{ url: string; file_size: number; mime_type: string }> {
  const proposal = await getLandProposal(proposalId, ctx);
  if (!canManagePhotos(proposal, ctx)) {
    throw new Error("Hanya pengaju (saat pending) atau admin yang dapat menambah foto");
  }

  const config = getConfig();
  const filePath = `proposals/${proposalId}/${crypto.randomUUID()}.webp`;

  const source = new Uint8Array(await file.arrayBuffer());

  if (!isImageBuffer(source)) {
    throw new Error("File bukan gambar yang valid (JPG/PNG/WebP)");
  }

  let buffer: Buffer;
  try {
    buffer = await sharp(source, { failOn: "error" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new Error("File bukan gambar yang valid (JPG/PNG/WebP)");
  }
  const contentType = "image/webp";

  const uploadRes = await fetch(
    `${config.supabaseUrl}/storage/v1/object/land-proposal-photos/${filePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        apikey: config.supabaseServiceRoleKey,
        "Content-Type": contentType,
        "Cache-Control": "3600",
        "x-upsert": "false",
      },
      body: new Uint8Array(buffer),
    },
  );

  const uploadBodyText = await uploadRes.text();
  if (!uploadRes.ok) {
    throw new Error(
      `STORAGE_UPLOAD_HTTP_${uploadRes.status}: ${uploadBodyText.slice(0, 300)}`,
    );
  }

  const objectPath = filePath;

  const insertRes = await fetch(
    `${config.supabaseUrl}/rest/v1/land_proposal_photos`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        apikey: config.supabaseServiceRoleKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        proposal_id: proposalId,
        url: objectPath,
        file_size: buffer.length,
        mime_type: contentType,
      }),
    },
  );

  const insertBodyText = await insertRes.text();
  if (!insertRes.ok) {
    throw new Error(
      `DB_INSERT_HTTP_${insertRes.status}: ${insertBodyText.slice(0, 300)}`,
    );
  }

  let inserted: { url: string; file_size: number; mime_type: string };
  try {
    const rows = JSON.parse(insertBodyText);
    inserted = Array.isArray(rows) ? rows[0] : rows;
  } catch {
    inserted = { url: objectPath, file_size: buffer.length, mime_type: contentType };
  }

  return inserted;
}

export async function deleteLandProposalPhoto(
  photoId: string,
  proposalId: string,
  ctx: AuthContext,
): Promise<void> {
  const proposal = await getLandProposal(proposalId, ctx);
  if (!canManagePhotos(proposal, ctx)) {
    throw new Error("Hanya pengaju (saat pending) atau admin yang dapat menghapus foto");
  }

  const admin = createAdminClient();
  const { data: photo } = await admin
    .from("land_proposal_photos")
    .select("id, url")
    .eq("id", photoId)
    .eq("proposal_id", proposalId)
    .maybeSingle();

  if (!photo) throw new Error("Foto tidak ditemukan");

  const { error } = await admin
    .from("land_proposal_photos")
    .delete()
    .eq("id", photoId)
    .eq("proposal_id", proposalId);

  if (error) throw error;

  try {
    await admin.storage.from("land-proposal-photos").remove([photo.url]);
  } catch (e) {
    logger.warn("land-proposal-service: failed to remove photo object", {
      photoId,
      error: String(e),
    });
  }
}

// Validate image content by checking magic bytes (JPEG/PNG/WebP).
function isImageBuffer(buf: Uint8Array): boolean {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return true;
  }
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return true;
  }
  return false;
}

// ---------- Notifications ----------

export async function notifyProposalSubmitted(kabupatenId: string, label: string): Promise<void> {
  const admin = createAdminClient();
  const { data: qcs } = await admin
    .from("users")
    .select("id")
    .eq("role", "qc")
    .contains("assigned_kabupaten_ids", [kabupatenId]);

  const { data: admins } = await admin.from("users").select("id").eq("role", "admin");

  const recipients = new Set<string>([
    ...(qcs ?? []).map((u) => u.id),
    ...(admins ?? []).map((u) => u.id),
  ]);

  await Promise.all(
    [...recipients].map((userId) =>
      createNotification({
        userId,
        title: "Pengajuan lahan baru",
        message: `Ada pengajuan lahan baru ${label ? `di ${label}` : ""} menunggu persetujuan.`,
        type: "info",
        link: "/pengajuan-lahan",
      }),
    ),
  );
}

export async function notifyProposalReviewed(
  proposedBy: string,
  approved: boolean,
  kabupatenName?: string,
): Promise<void> {
  await createNotification({
    userId: proposedBy,
    title: approved ? "Pengajuan disetujui" : "Pengajuan ditolak",
    message: approved
      ? `Pengajuan lahan${kabupatenName ? ` di ${kabupatenName}` : ""} disetujui dan telah menjadi jadwal.`
      : `Pengajuan lahan${kabupatenName ? ` di ${kabupatenName}` : ""} ditolak. Lihat catatan untuk detail.`,
    type: approved ? "success" : "warning",
    link: "/pengajuan-lahan",
  });
}

export function isProposalTerminal(status: LandProposalStatus): boolean {
  return status === "approved" || status === "rejected" || status === "cancelled";
}
