import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AuthContext } from "@/lib/auth/authorization";
import { qcKabupatenScope } from "@/lib/auth/authorization";
import { createSchedule } from "@/features/schedules/services/schedule-service";
import { createNotification } from "@/features/notifications/services/notification-service";
import { dateString } from "@/lib/utils/date";
import type { LandProposal, LandProposalStatus } from "@/types";

const PROPOSAL_SELECT =
  "*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), proposed_by_user:users!land_proposals_proposed_by_fkey(name), reviewed_by_user:users!land_proposals_reviewed_by_fkey(name), created_schedule:schedules!land_proposals_created_schedule_id_fkey(id, visit_date)";

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
  return (data ?? []) as LandProposal[];
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
  return data as LandProposal;
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
  if (proposal.proposed_by !== ctx.userId) throw new Error("Hanya pengaju yang dapat mengubah pengajuan");
  if (proposal.status !== "pending") throw new Error("Hanya pengajuan pending yang dapat diubah");

  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("land_proposals")
    .update(data)
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
