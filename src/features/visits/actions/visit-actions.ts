"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { visitNotesSchema } from "../schema/visit-schema";
import { saveVisitNotes, uploadVisitPhoto, deleteVisitPhoto } from "../services/visit-service";
import type { ActionResponse } from "@/types/common";

export async function saveVisitNotesAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

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

  try {
    await saveVisitNotes(parsed.data);
    await createAdminClient().from("activity_logs").insert({
      user_id: user.id,
      action: "notes_saved",
      entity_type: "schedules",
      entity_id: raw.schedule_id,
      metadata: { has_observation: !!raw.observation },
    });
    revalidatePath(`/visits/${raw.schedule_id}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan catatan";
    return { success: false, error: msg };
  }
}

export async function uploadPhotoAction(formData: FormData): Promise<ActionResponse<{ url: string; file_size: number; mime_type: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const scheduleId = formData.get("schedule_id") as string;
  const file = formData.get("file") as File;

  if (!scheduleId || !file) {
    return { success: false, error: "Data tidak lengkap" };
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
    await createAdminClient().from("activity_logs").insert({
      user_id: user.id,
      action: "photo_uploaded",
      entity_type: "schedules",
      entity_id: scheduleId,
      metadata: { url: result.url },
    });
    revalidatePath(`/visits/${scheduleId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupload foto";
    return { success: false, error: msg };
  }
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const photoId = formData.get("photo_id") as string;
  const scheduleId = formData.get("schedule_id") as string;

  await deleteVisitPhoto(photoId);
  revalidatePath(`/visits/${scheduleId}`);
}
