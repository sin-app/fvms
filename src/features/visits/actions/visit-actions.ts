"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logger } from "@/lib/logger";
import { getAuthContext, canAccessSchedule } from "@/lib/auth/authorization";
import { visitNotesSchema } from "../schema/visit-schema";
import { saveVisitNotes, uploadVisitPhoto, deleteVisitPhoto, getOwnedPhoto, updateVisitPhoto } from "../services/visit-service";
import type { ActionResponse } from "@/types/common";

export async function saveVisitNotesAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const raw = {
    schedule_id: formData.get("schedule_id") as string,
    observation: (formData.get("observation") as string) || undefined,
    problem: (formData.get("problem") as string) || undefined,
    recommend: (formData.get("recommend") as string) || undefined,
    additional: (formData.get("additional") as string) || undefined,
  };

  const parsed = visitNotesSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (!(await canAccessSchedule(raw.schedule_id, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  try {
    await saveVisitNotes(parsed.data);
    // Move from pending to in_progress once field work notes are recorded.
    try {
      const admin = createAdminClient();
      const { data: cur } = await admin
        .from("schedules")
        .select("status")
        .eq("id", raw.schedule_id)
        .maybeSingle();
      if (cur && cur.status === "pending") {
        await admin
          .from("schedules")
          .update({ status: "in_progress" })
          .eq("id", raw.schedule_id);
      }
    } catch (statusErr) {
      logger.warn("saveVisitNotesAction: status update skipped", {
        scheduleId: raw.schedule_id,
        error: statusErr instanceof Error ? statusErr.message : String(statusErr),
      });
    }
    await createAdminClient().from("activity_logs").insert({
      user_id: ctx.userId,
      action: "notes_saved",
      entity_type: "schedules",
      entity_id: raw.schedule_id,
      metadata: { has_observation: !!raw.observation },
    });
    revalidatePath(`/visits/${raw.schedule_id}`);
    revalidatePath("/reports");
    revalidatePath("/schedules");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan catatan";
    return { success: false, error: msg };
  }
}

export async function uploadPhotoAction(formData: FormData): Promise<ActionResponse<{ url: string; file_size: number; mime_type: string }>> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const scheduleId = formData.get("schedule_id") as string;
  const file = formData.get("file") as File;

  if (!scheduleId || !file) {
    return { success: false, error: "Data tidak lengkap" };
  }

  if (!(await canAccessSchedule(scheduleId, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File terlalu besar. Maksimal 10MB" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP" };
  }

  try {
    const result = await uploadVisitPhoto(scheduleId, file);
    try {
      await createAdminClient().from("activity_logs").insert({
        user_id: ctx.userId,
        action: "photo_uploaded",
        entity_type: "schedules",
        entity_id: scheduleId,
        metadata: { url: result.url },
      });
    } catch (logErr) {
      logger.warn("uploadPhotoAction: activity_log insert skipped", {
        scheduleId,
        error: logErr instanceof Error ? logErr.message : String(logErr),
      });
    }
    // Mark the schedule as completed once a photo (proof of visit) is uploaded.
    try {
      const admin = createAdminClient();
      const { data: cur } = await admin
        .from("schedules")
        .select("status")
        .eq("id", scheduleId)
        .maybeSingle();
      if (cur && cur.status !== "cancelled" && cur.status !== "completed") {
        await admin.from("schedules").update({ status: "completed" }).eq("id", scheduleId);
      }
    } catch (statusErr) {
      logger.warn("uploadPhotoAction: status update skipped", {
        scheduleId,
        error: statusErr instanceof Error ? statusErr.message : String(statusErr),
      });
    }
    revalidatePath(`/visits/${scheduleId}`);
    revalidatePath("/reports");
    revalidatePath("/schedules");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupload foto";
    logger.error("uploadPhotoAction: upload failed", {
      scheduleId,
      name: err instanceof Error ? err.name : "Error",
      error: msg,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return { success: false, error: msg };
  }
}

export async function deletePhotoAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const photoId = formData.get("photo_id") as string;
  const scheduleId = formData.get("schedule_id") as string;

  if (!photoId || !scheduleId) return { success: false, error: "Data tidak lengkap" };

  if (!(await canAccessSchedule(scheduleId, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  // QC may not delete photos. Only admin or the owning produksi may delete.
  if (ctx.role === "qc") {
    return { success: false, error: "QC tidak diizinkan menghapus foto" };
  }

  const owned = await getOwnedPhoto(photoId, scheduleId);
  if (!owned) return { success: false, error: "Foto tidak ditemukan" };

  try {
    await deleteVisitPhoto(photoId);
    revalidatePath(`/visits/${scheduleId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus foto";
    return { success: false, error: msg };
  }
}

export async function updatePhotoAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const photoId = formData.get("photo_id") as string;
  const scheduleId = formData.get("schedule_id") as string;
  const caption = (formData.get("caption") as string) ?? "";

  if (!photoId || !scheduleId) return { success: false, error: "Data tidak lengkap" };

  if (!(await canAccessSchedule(scheduleId, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  // QC may not edit photos. Only admin or the owning produksi may edit.
  if (ctx.role === "qc") {
    return { success: false, error: "QC tidak diizinkan mengubah foto" };
  }

  const owned = await getOwnedPhoto(photoId, scheduleId);
  if (!owned) return { success: false, error: "Foto tidak ditemukan" };

  try {
    await updateVisitPhoto(photoId, caption);
    revalidatePath(`/visits/${scheduleId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui foto";
    return { success: false, error: msg };
  }
}
