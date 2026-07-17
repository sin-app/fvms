"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { scheduleSchema } from "../schema/schedule-schema";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../services/schedule-service";
import type { ActionResponse } from "@/types/common";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function createScheduleAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const raw = {
    user_id: formData.get("user_id") as string,
    kabupaten_id: formData.get("kabupaten_id") as string,
    kecamatan_id: formData.get("kecamatan_id") as string,
    desa_id: formData.get("desa_id") as string,
    visit_date: formData.get("visit_date") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await createSchedule(parsed.data);
    revalidatePath("/schedules");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat jadwal";
    return { success: false, error: msg };
  }
}

export async function updateScheduleAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    user_id: formData.get("user_id") as string,
    kabupaten_id: formData.get("kabupaten_id") as string,
    kecamatan_id: formData.get("kecamatan_id") as string,
    desa_id: formData.get("desa_id") as string,
    visit_date: formData.get("visit_date") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateSchedule(id, parsed.data);
    revalidatePath("/schedules");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate jadwal";
    return { success: false, error: msg };
  }
}

export async function deleteScheduleAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID tidak valid");

  await deleteSchedule(id);
  revalidatePath("/schedules");
}

export async function updateVisitStatusAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const latitude = formData.get("latitude") as string;
  const longitude = formData.get("longitude") as string;

  if (!id || !status) {
    return { success: false, error: "Data tidak lengkap" };
  }

  const validStatuses = ["pending", "on_the_way", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Status tidak valid" };
  }

  try {
    const admin = createAdminClient();
    const updateData: Record<string, unknown> = { status };

    if (latitude && longitude) {
      updateData.latitude = parseFloat(latitude);
      updateData.longitude = parseFloat(longitude);
    }

    if (status === "completed") {
      updateData.visit_time = new Date().toISOString();
    }

    await admin.from("schedules").update(updateData).eq("id", id);

    await admin.from("activity_logs").insert({
      user_id: user.id,
      action: "status_changed",
      entity_type: "schedules",
      entity_id: id,
      metadata: { status },
    });

    revalidatePath("/schedules");
    revalidatePath(`/visits/${id}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate status";
    return { success: false, error: msg };
  }
}
