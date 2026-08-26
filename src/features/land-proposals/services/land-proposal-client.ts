"use client";

import { STATUS_VALUES } from "@/lib/constants/status";
import { getOfflineDb, isOfflineDbAvailable, type OfflineLandProposal } from "@/lib/offline/db";
import { queueMutation } from "@/lib/offline/engine";
import { landProposalSchema } from "../schema/land-proposal-schema";

export interface OfflineSaveResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseForm(formData: FormData) {
  const raw = {
    kabupaten_id: formData.get("kabupaten_id") as string,
    kecamatan_id: formData.get("kecamatan_id") as string,
    desa_id: formData.get("desa_id") as string,
    block_no: (formData.get("block_no") as string) || undefined,
    no_plot: (formData.get("no_plot") as string) || undefined,
    document_no: (formData.get("document_no") as string) || undefined,
    member_name: (formData.get("member_name") as string) || undefined,
    cgr: (formData.get("cgr") as string) || undefined,
    cgr_code: (formData.get("cgr_code") as string) || undefined,
    nis: (formData.get("nis") as string) || undefined,
    ph_tanah: formData.get("ph_tanah") ?? "",
    real_tanam_ha: formData.get("real_tanam_ha") ?? "",
    detaseling: (formData.get("detaseling") as string) || undefined,
    tgl_tanam: (formData.get("tgl_tanam") as string) || undefined,
    rencana_panen: (formData.get("rencana_panen") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
    accuracy: formData.get("accuracy") ?? "",
  };

  const parsed = landProposalSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  return { success: true as const, data: parsed.data };
}

/** Simpan pengajuan lahan secara lokal (offline) lalu antrekan ke outbox. */
export async function saveLandProposalOffline(
  formData: FormData,
  ctx: { id: string },
  isEditing: boolean,
): Promise<OfflineSaveResult> {
  if (!isOfflineDbAvailable()) {
    return { success: false, error: "Penyimpanan luring tidak tersedia" };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) return parsed;

  const id = isEditing ? ((formData.get("id") as string) || crypto.randomUUID()) : crypto.randomUUID();
  const now = new Date().toISOString();
  const { data } = parsed;

  const db = getOfflineDb();
  const existing = isEditing ? await db.landProposals.get(id) : undefined;
  const status: string = isEditing ? existing?.status ?? "pending" : STATUS_VALUES.pending;

  const row: OfflineLandProposal = {
    id,
    proposed_by: ctx.id,
    kabupaten_id: data.kabupaten_id,
    kecamatan_id: data.kecamatan_id,
    desa_id: data.desa_id,
    block_no: data.block_no ?? null,
    no_plot: data.no_plot ?? null,
    document_no: data.document_no ?? null,
    member_name: data.member_name ?? null,
    cgr: data.cgr ?? null,
    cgr_code: data.cgr_code ?? null,
    nis: data.nis ?? null,
    ph_tanah: data.ph_tanah ?? null,
    real_tanam_ha: data.real_tanam_ha ?? null,
    detaseling: data.detaseling ?? null,
    tgl_tanam: data.tgl_tanam ?? null,
    rencana_panen: data.rencana_panen ?? null,
    notes: data.notes ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    accuracy: data.accuracy ?? null,
    status,
    reviewed_by: null,
    review_note: null,
    created_schedule_id: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const payload: Record<string, unknown> = {
    id,
    proposed_by: ctx.id,
    kabupaten_id: data.kabupaten_id,
    kecamatan_id: data.kecamatan_id,
    desa_id: data.desa_id,
    block_no: data.block_no ?? null,
    no_plot: data.no_plot ?? null,
    document_no: data.document_no ?? null,
    member_name: data.member_name ?? null,
    cgr: data.cgr ?? null,
    cgr_code: data.cgr_code ?? null,
    nis: data.nis ?? null,
    ph_tanah: data.ph_tanah ?? null,
    real_tanam_ha: data.real_tanam_ha ?? null,
    detaseling: data.detaseling ?? null,
    tgl_tanam: data.tgl_tanam ?? null,
    rencana_panen: data.rencana_panen ?? null,
    notes: data.notes ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    accuracy: data.accuracy ?? null,
  };
  if (!isEditing) payload.status = STATUS_VALUES.pending;

  await db.landProposals.put(row);
  await queueMutation({
    table: "land_proposals",
    action: isEditing ? "upsert" : "insert",
    entity_id: id,
    payload,
  });

  return { success: true };
}

/** Batalkan pengajuan lahan secara lokal (offline) lalu antrekan ke outbox. */
export async function cancelLandProposalOffline(id: string): Promise<OfflineSaveResult> {
  if (!isOfflineDbAvailable()) {
    return { success: false, error: "Penyimpanan luring tidak tersedia" };
  }

  const db = getOfflineDb();
  await db.landProposals.update(id, { status: "cancelled", updated_at: new Date().toISOString() });
  await queueMutation({
    table: "land_proposals",
    action: "upsert",
    entity_id: id,
    payload: { id, status: "cancelled" },
  });

  return { success: true };
}
