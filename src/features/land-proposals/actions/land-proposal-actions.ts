"use server";

import { getAuthContext } from "@/lib/auth/authorization";
import { landProposalSchema, landProposalReviewSchema } from "../schema/land-proposal-schema";
import {
  createLandProposal,
  updateLandProposal,
  cancelLandProposal,
  approveLandProposal,
  rejectLandProposal,
  assignPetugas,
  notifyProposalSubmitted,
} from "../services/land-proposal-service";
import type { ActionResponse } from "@/types/common";
import { revalidateProposalPaths, revalidateSchedulePaths } from "@/lib/revalidate";

function parseLandProposal(formData: FormData) {
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

export async function createLandProposalAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "produksi" && ctx.role !== "admin") {
    return { success: false, error: "Hanya produksi yang dapat mengajukan lahan" };
  }

  const parsed = parseLandProposal(formData);
  if (!parsed.success) return parsed;

  try {
    await createLandProposal(parsed.data, ctx);
    await notifyProposalSubmitted(parsed.data.kabupaten_id, "");
    revalidateProposalPaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengajukan lahan";
    return { success: false, error: msg };
  }
}

export async function updateLandProposalAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const parsed = parseLandProposal(formData);
  if (!parsed.success) return parsed;

  try {
    await updateLandProposal(id, parsed.data, ctx);
    revalidateProposalPaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengubah pengajuan";
    return { success: false, error: msg };
  }
}

export async function cancelLandProposalAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  try {
    await cancelLandProposal(id, ctx);
    revalidateProposalPaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membatalkan pengajuan";
    return { success: false, error: msg };
  }
}

export async function approveLandProposalAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin" && ctx.role !== "qc") {
    return { success: false, error: "Hanya QC/Admin yang dapat menyetujui pengajuan" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  try {
    await approveLandProposal(id, ctx);
    revalidateProposalPaths();
    revalidateSchedulePaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyetujui pengajuan";
    return { success: false, error: msg };
  }
}

export async function rejectLandProposalAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin" && ctx.role !== "qc") {
    return { success: false, error: "Hanya QC/Admin yang dapat menolak pengajuan" };
  }

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const parsed = landProposalReviewSchema.safeParse({
    review_note: (formData.get("review_note") as string) || "",
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Catatan wajib diisi saat menolak",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await rejectLandProposal(id, parsed.data.review_note, ctx);
    revalidateProposalPaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menolak pengajuan";
    return { success: false, error: msg };
  }
}

export async function assignPetugasAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin" && ctx.role !== "qc") {
    return { success: false, error: "Hanya QC/Admin yang dapat menugaskan petugas" };
  }

  const id = formData.get("id") as string;
  const userId = formData.get("user_id") as string;
  if (!id || !userId) return { success: false, error: "Data tidak lengkap" };

  try {
    await assignPetugas(id, userId, ctx);
    revalidateProposalPaths();
    revalidateSchedulePaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menugaskan petugas";
    return { success: false, error: msg };
  }
}