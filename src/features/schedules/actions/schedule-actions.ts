"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { scheduleSchema } from "../schema/schedule-schema";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleOwnerIds,
} from "../services/schedule-service";
import type { ActionResponse } from "@/types/common";
import { STATUS_TRANSITIONS } from "@/lib/constants/status";
import type { VisitStatus } from "@/types";
import { getAuthContext, isPrivileged, canAccessSchedule } from "@/lib/auth/authorization";

export async function createScheduleAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const raw = {
    user_id: formData.get("user_id") as string,
    kabupaten_id: formData.get("kabupaten_id") as string,
    kecamatan_id: formData.get("kecamatan_id") as string,
    desa_id: formData.get("desa_id") as string,
    visit_date: formData.get("visit_date") as string,
    notes: (formData.get("notes") as string) || undefined,
    cgr: (formData.get("cgr") as string) || undefined,
    cgr_code: (formData.get("cgr_code") as string) || undefined,
    block_no: (formData.get("block_no") as string) || undefined,
    no_plot: (formData.get("no_plot") as string) || undefined,
    member_name: (formData.get("member_name") as string) || undefined,
    document_no: (formData.get("document_no") as string) || undefined,
    nis: (formData.get("nis") as string) || undefined,
    ph_tanah: formData.get("ph_tanah") as string,
    real_tanam_ha: formData.get("real_tanam_ha") as string,
    gagal_tanam: formData.get("gagal_tanam") as string,
    sisa_di_lahan_ha: formData.get("sisa_di_lahan_ha") as string,
    tgl_tanam: (formData.get("tgl_tanam") as string) || undefined,
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Non-privileged users can only create schedules assigned to themselves.
  if (!isPrivileged(ctx.role) && parsed.data.user_id !== ctx.userId) {
    return { success: false, error: "Tidak dapat membuat jadwal untuk user lain" };
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
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    user_id: formData.get("user_id") as string,
    kabupaten_id: formData.get("kabupaten_id") as string,
    kecamatan_id: formData.get("kecamatan_id") as string,
    desa_id: formData.get("desa_id") as string,
    visit_date: formData.get("visit_date") as string,
    notes: (formData.get("notes") as string) || undefined,
    cgr: (formData.get("cgr") as string) || undefined,
    cgr_code: (formData.get("cgr_code") as string) || undefined,
    block_no: (formData.get("block_no") as string) || undefined,
    no_plot: (formData.get("no_plot") as string) || undefined,
    member_name: (formData.get("member_name") as string) || undefined,
    document_no: (formData.get("document_no") as string) || undefined,
    nis: (formData.get("nis") as string) || undefined,
    ph_tanah: formData.get("ph_tanah") as string,
    real_tanam_ha: formData.get("real_tanam_ha") as string,
    gagal_tanam: formData.get("gagal_tanam") as string,
    sisa_di_lahan_ha: formData.get("sisa_di_lahan_ha") as string,
    tgl_tanam: (formData.get("tgl_tanam") as string) || undefined,
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (!isPrivileged(ctx.role)) {
    if (!(await canAccessSchedule(id, ctx))) {
      return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
    }
    if (parsed.data.user_id !== ctx.userId) {
      return { success: false, error: "Tidak dapat mengubah jadwal untuk user lain" };
    }
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

export async function shiftScheduleDateAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const daysRaw = formData.get("days");
  const days = daysRaw ? Number(daysRaw) : 1;
  if (!Number.isInteger(days) || days === 0) {
    return { success: false, error: "Jumlah hari tidak valid" };
  }

  if (!(await canAccessSchedule(id, ctx))) {
    return { success: false, error: "Jadwal tidak ditemukan" };
  }

  try {
    const admin = createAdminClient();
    const { data: schedule, error: fetchError } = await admin
      .from("schedules")
      .select("user_id, visit_date")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!schedule) return { success: false, error: "Jadwal tidak ditemukan" };

    const current = new Date(schedule.visit_date + "T00:00:00");
    if (Number.isNaN(current.getTime())) {
      return { success: false, error: "Tanggal jadwal tidak valid" };
    }
    current.setDate(current.getDate() + days);
    const nextDate = current.toISOString().split("T")[0];

    await updateSchedule(id, { visit_date: nextDate });
    revalidatePath("/schedules");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menggeser tanggal jadwal";
    return { success: false, error: msg };
  }
}

export async function deleteScheduleAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  if (ctx.role === "admin") {
    // admin may delete any schedule
  } else if (ctx.role === "produksi") {
    const { data } = await createAdminClient()
      .from("schedules")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();
    if (data?.user_id !== ctx.userId) return { success: false, error: "Tidak memiliki akses" };
  } else {
    // QC and other non-admin/non-produksi roles cannot delete
    return { success: false, error: "Hanya admin atau pemilik jadwal yang dapat menghapus" };
  }

  try {
    await deleteSchedule(id);
    revalidatePath("/schedules");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus jadwal";
    return { success: false, error: msg };
  }
}

export async function bulkActionSchedules(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const idsJson = formData.get("ids") as string;
  const action = formData.get("bulkAction") as string;

  if (!idsJson || !action) return { success: false, error: "Data tidak lengkap" };

  let ids: string[];
  try {
    ids = JSON.parse(idsJson);
  } catch {
    return { success: false, error: "ID tidak valid" };
  }

  if (!ids.length) return { success: false, error: "Tidak ada data dipilih" };

  // Only admin may delete schedules. Produksi may only delete their own,
  // and QC may not delete at all.
  if (action === "delete" && ctx.role !== "admin" && ctx.role !== "produksi") {
    return { success: false, error: "Hanya admin atau pemilik jadwal yang dapat menghapus" };
  }

  // Non-privileged users may only act on schedules they own.
  if (!isPrivileged(ctx.role)) {
    const owned = await getScheduleOwnerIds(ids);
    const ownedIds = new Set(owned.map((o) => o.id));
    const unauthorized = ids.filter((id) => !ownedIds.has(id));
    if (unauthorized.length > 0) {
      return { success: false, error: "Tidak memiliki akses ke beberapa jadwal" };
    }
  }

  const admin = createAdminClient();

  try {
    if (action === "delete") {
      const query = admin
        .from("schedules")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (!isPrivileged(ctx.role)) query.eq("user_id", ctx.userId);
      const { error } = await query;
      if (error) throw error;
    } else if (action === "approve") {
      const query = admin
        .from("schedules")
        .update({ status: "on_the_way" })
        .in("id", ids)
        .eq("status", "pending");
      if (!isPrivileged(ctx.role)) query.eq("user_id", ctx.userId);
      const { error } = await query;
      if (error) throw error;
    } else if (action === "cancel") {
      const query = admin
        .from("schedules")
        .update({ status: "cancelled" })
        .in("id", ids)
        .in("status", ["pending", "on_the_way"]);
      if (!isPrivileged(ctx.role)) query.eq("user_id", ctx.userId);
      const { error } = await query;
      if (error) throw error;
    } else if (action === "shift_forward") {
      const { data: toShift, error: fetchErr } = await admin
        .from("schedules")
        .select("id, visit_date")
        .in("id", ids)
        .is("deleted_at", null);
      if (fetchErr) throw fetchErr;
      for (const s of toShift ?? []) {
        const next = new Date(s.visit_date + "T00:00:00");
        next.setDate(next.getDate() + 1);
        await admin.from("schedules").update({ visit_date: next.toISOString().split("T")[0] }).eq("id", s.id);
      }
    } else if (action === "shift_backward") {
      const { data: toShift, error: fetchErr } = await admin
        .from("schedules")
        .select("id, visit_date")
        .in("id", ids)
        .is("deleted_at", null);
      if (fetchErr) throw fetchErr;
      for (const s of toShift ?? []) {
        const prev = new Date(s.visit_date + "T00:00:00");
        prev.setDate(prev.getDate() - 1);
        await admin.from("schedules").update({ visit_date: prev.toISOString().split("T")[0] }).eq("id", s.id);
      }
    } else if (["pending", "on_the_way", "in_progress", "completed"].includes(action)) {
      const query = admin
        .from("schedules")
        .update({ status: action })
        .in("id", ids)
        .neq("status", "cancelled");
      if (!isPrivileged(ctx.role)) query.eq("user_id", ctx.userId);
      const { error } = await query;
      if (error) throw error;
    } else {
      return { success: false, error: "Aksi tidak dikenal" };
    }

    const logs = ids.map((id) => ({
      user_id: ctx.userId,
      action: "bulk_status_changed",
      entity_type: "schedules",
      entity_id: id,
      metadata: { bulkAction: action },
    }));
    await admin.from("activity_logs").insert(logs);

    revalidatePath("/schedules");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses aksi";
    return { success: false, error: msg };
  }
}

export async function updateVisitStatusAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

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

  if (!isPrivileged(ctx.role)) {
    const { data } = await createAdminClient()
      .from("schedules")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();
    if (data?.user_id !== ctx.userId) {
      return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
    }
  }

  // Cegah regresi status (completed/cancelled tidak bisa diubah lagi) dan
  // validasi transisi yang diizinkan.
  const { data: current } = await createAdminClient()
    .from("schedules")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  const currentStatus = (current?.status ?? "pending") as (typeof validStatuses)[number] as VisitStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(status as VisitStatus)) {
    return {
      success: false,
      error: `Transisi status ${currentStatus} -> ${status} tidak diizinkan`,
    };
  }

  const lat = latitude ? Number(latitude) : NaN;
  const lon = longitude ? Number(longitude) : NaN;
  if ((latitude || longitude) && (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
    return { success: false, error: "Koordinat GPS tidak valid" };
  }

  try {
    const admin = createAdminClient();
    const updateData: Record<string, unknown> = { status };

    if (latitude && longitude) {
      updateData.latitude = lat;
      updateData.longitude = lon;
    }

    if (status === "completed") {
      updateData.visit_time = new Date().toISOString();
    }

    await admin.from("schedules").update(updateData).eq("id", id);

    await admin.from("activity_logs").insert({
      user_id: ctx.userId,
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
