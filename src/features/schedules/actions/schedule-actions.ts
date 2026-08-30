"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { scheduleSchema } from "../schema/schedule-schema";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  restoreSchedule,
  getScheduleOwnerIds,
} from "../services/schedule-service";
import type { ActionResponse } from "@/types/common";
import { STATUS_TRANSITIONS, SCHEDULE_STATUSES, STATUS_VALUES } from "@/lib/constants/status";
import type { VisitStatus } from "@/types";
import { dateString } from "@/lib/utils/date";
import { getAuthContext, isPrivileged, canAccessSchedule, qcKabupatenScope } from "@/lib/auth/authorization";
import { deriveScheduleStatus } from "@/features/panen/services/panen-logic";
import { revalidateSchedulePaths } from "@/lib/revalidate";

export async function createScheduleAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const parsed = parseAndValidateSchedule(formData);
  if (!parsed.success) return parsed;

  const derived = deriveScheduleStatus({ ...parsed.data, hasActivity: false });
  if (derived && !(derived.status === "completed" && ctx.role === "produksi")) {
    parsed.data.status = derived.status as VisitStatus;
    if (derived.panen_keterangan) parsed.data.panen_keterangan = derived.panen_keterangan;
  }

  // Non-privileged users can only create schedules assigned to themselves.
  if (!isPrivileged(ctx.role) && parsed.data.user_id !== ctx.userId) {
    return { success: false, error: "Tidak dapat membuat jadwal untuk user lain" };
  }

  // QC hanya boleh membuat jadwal di dalam kabupaten tugasnya.
  if (ctx.role === "qc") {
    const scope = qcKabupatenScope(ctx) ?? [];
    if (scope.length === 0 || !parsed.data.kabupaten_id || !scope.includes(parsed.data.kabupaten_id)) {
      return { success: false, error: "Kabupaten di luar wilayah tugas QC" };
    }
  }

  try {
    await createSchedule(parsed.data);
    revalidateSchedulePaths();
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

  const parsed = parseAndValidateSchedule(formData);
  if (!parsed.success) return parsed;

  // Fetch existing DB values so derivation uses actual data when form fields are empty
  const { data: existing } = await createAdminClient()
    .from("schedules")
    .select("visit_time, notes, latitude, tgl_panen, real_panen, status, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, visit_photos(id)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

   
  const existingPhotos = (existing as unknown as { visit_photos?: { id: string }[] | null })?.visit_photos ?? [];
  const hasActivity = !!(
    existing?.visit_time ||
    existing?.notes ||
    existing?.latitude ||
    existing?.tgl_panen ||
    existing?.real_panen ||
    parsed.data.notes ||
    existingPhotos.length > 0
  );
  const derived = deriveScheduleStatus({
    real_tanam_ha: parsed.data.real_tanam_ha ?? existing?.real_tanam_ha ?? undefined,
    gagal_tanam: parsed.data.gagal_tanam ?? existing?.gagal_tanam ?? undefined,
    sisa_di_lahan_ha: parsed.data.sisa_di_lahan_ha ?? existing?.sisa_di_lahan_ha ?? undefined,
    hasActivity,
  });
  if (derived) {
    // Jangan menurunkan status terminal (hasil tindakan eksplisit) ke pending/in_progress.
    const existingIsExplicit = existing?.status === "completed" || existing?.status === "gagal_total" || existing?.status === "gagal_partial";
    const derivedIsFallback = derived.status === "pending" || derived.status === "in_progress";
    // Produksi tidak boleh memicu status completed (verifikasi hanya QC/admin).
    const produksiCompleted = derived.status === "completed" && ctx.role === "produksi";
    if (!(existingIsExplicit && derivedIsFallback) && !produksiCompleted) {
      parsed.data.status = derived.status as VisitStatus;
      if (derived.panen_keterangan) parsed.data.panen_keterangan = derived.panen_keterangan;
    }
  }

  // Non-admin users must pass the access check.
  if (ctx.role !== "admin") {
    if (!(await canAccessSchedule(id, ctx))) {
      return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
    }
    if (!isPrivileged(ctx.role) && parsed.data.user_id !== ctx.userId) {
      return { success: false, error: "Tidak dapat mengubah jadwal untuk user lain" };
    }
    if (ctx.role === "qc" && parsed.data.kabupaten_id) {
      const scope = qcKabupatenScope(ctx) ?? [];
      if (scope.length === 0 || !scope.includes(parsed.data.kabupaten_id)) {
        return { success: false, error: "Kabupaten di luar wilayah tugas QC" };
      }
    }
  }

  try {
    await updateSchedule(id, parsed.data);
    revalidateSchedulePaths(id);
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
  if (!Number.isInteger(days) || days === 0 || Math.abs(days) > 365) {
    return { success: false, error: "Jumlah hari tidak valid (maksimal ±365 hari)" };
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
      .is("deleted_at", null)
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
    revalidateSchedulePaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menggeser tanggal";
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
    return { success: false, error: "Hanya admin atau pemilik jadwal yang dapat menghapus" };
  }

  try {
    await deleteSchedule(id);
    revalidateSchedulePaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus jadwal";
    return { success: false, error: msg };
  }
}

export async function restoreScheduleAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  if (ctx.role !== "admin") {
    return { success: false, error: "Hanya admin yang dapat memulihkan jadwal" };
  }

  try {
    await restoreSchedule(id);
    revalidateSchedulePaths();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memulihkan jadwal";
    return { success: false, error: msg };
  }
}

export async function updateLabelAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  const label = formData.get("label") as string;

  if (!id) return { success: false, error: "ID tidak valid" };
  if (label && label !== "hijau" && label !== "kuning" && label !== "merah") {
    return { success: false, error: "Label tidak valid" };
  }

  if (!(await canAccessSchedule(id, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  // Only admin and QC can set labels
  if (ctx.role !== "admin" && ctx.role !== "qc") {
    return { success: false, error: "Hanya admin dan QC yang dapat memberi label" };
  }

  try {
    await createAdminClient()
      .from("schedules")
      .update({ label: label || null })
      .eq("id", id);
    revalidateSchedulePaths(id);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate label";
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

  // Only admin may delete schedules. Produksi may only delete their own.
  if (action === "delete" && ctx.role === "qc") {
    return { success: false, error: "QC tidak diizinkan menghapus jadwal" };
  }
  if (action === "delete" && ctx.role !== "admin" && ctx.role !== "produksi") {
    return { success: false, error: "Hanya admin atau pemilik jadwal yang dapat menghapus" };
  }

  // QC is restricted to schedules within their assigned kabupaten.
  const kabScope = qcKabupatenScope(ctx);
  if (kabScope !== null && !(await filterIdsByKabupatenScope(ids, kabScope))) {
    return { success: false, error: "Tidak memiliki akses ke beberapa jadwal" };
  }

  // Non-privileged (produksi) users may only act on schedules they own.
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
        .update({ status: "in_progress" })
        .in("id", ids)
        .eq("status", "pending");
      if (!isPrivileged(ctx.role)) query.eq("user_id", ctx.userId);
      const { error } = await query;
      if (error) throw error;
    } else if (action === "cancel") {
      const query = admin
        .from("schedules")
        .update({ status: "gagal_total" })
        .in("id", ids)
        .in("status", ["pending"]);
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
        await admin.from("schedules").update({ visit_date: dateString(next) }).eq("id", s.id);
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
        await admin.from("schedules").update({ visit_date: dateString(prev) }).eq("id", s.id);
      }
    } else if (
      Object.values(STATUS_VALUES)
        .filter((s) => s !== STATUS_VALUES.gagal_total)
        .includes(action as VisitStatus)
    ) {
      const target = action as VisitStatus;

      // Status completed (verifikasi selesai) hanya boleh ditetapkan QC/admin.
      if (target === STATUS_VALUES.completed && ctx.role === "produksi") {
        return { success: false, error: "Hanya QC yang dapat menandai selesai (completed)" };
      }

      const { data: currentRows, error: statusErr } = await admin
        .from("schedules")
        .select("id, status")
        .in("id", ids)
        .is("deleted_at", null);
      if (statusErr) throw statusErr;

      const invalid = (currentRows ?? []).filter((row) => {
        const from = SCHEDULE_STATUSES.includes(row.status as VisitStatus)
          ? (row.status as VisitStatus)
          : STATUS_VALUES.pending;
        if (from === target) return false;
        return !(STATUS_TRANSITIONS[from] ?? []).includes(target);
      });
      if (invalid.length > 0) {
        return {
          success: false,
          error: `Transisi status tidak diizinkan untuk ${invalid.length} jadwal (mis. ${invalid[0]?.id.slice(0, 8) ?? ""}...)`,
        };
      }

      const query = admin
        .from("schedules")
        .update({ status: target })
        .in("id", ids)
        .is("deleted_at", null);
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

    revalidateSchedulePaths();
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

  const validStatuses = SCHEDULE_STATUSES;
  if (!validStatuses.includes(status as VisitStatus)) {
    return { success: false, error: "Status tidak valid" };
  }

  // Status completed (verifikasi selesai) hanya boleh ditetapkan QC/admin.
  if (status === "completed" && ctx.role === "produksi") {
    return { success: false, error: "Hanya QC yang dapat menandai selesai (completed)" };
  }

  if (!(await canAccessSchedule(id, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  const { data: current } = await createAdminClient()
    .from("schedules")
    .select("status")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  const currentStatus: VisitStatus = current && SCHEDULE_STATUSES.includes(current.status as VisitStatus)
    ? (current.status as VisitStatus)
    : STATUS_VALUES.pending;
  if (currentStatus !== status) {
    const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(status as VisitStatus)) {
      return {
        success: false,
        error: `Transisi status ${currentStatus} -> ${status} tidak diizinkan`,
      };
    }
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

    if (status === "completed" && ctx.role !== "qc") {
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

    revalidateSchedulePaths(id);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate status";
    return { success: false, error: msg };
  }
}

function parseAndValidateSchedule(formData: FormData) {
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
    detaseling: (formData.get("detaseling") as string) || undefined,
    sisa_di_lahan_ha: formData.get("sisa_di_lahan_ha") as string,
    tgl_tanam: (formData.get("tgl_tanam") as string) || undefined,
    rencana_panen: (formData.get("rencana_panen") as string) || undefined,
    real_panen: (formData.get("real_panen") as string) || undefined,
    tgl_panen: (formData.get("tgl_panen") as string) || undefined,
    panen_keterangan: (formData.get("panen_keterangan") as string) || undefined,
  };

  const parsed = scheduleSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      data: undefined,
    };
  }

  return { success: true as const, data: parsed.data };
}

async function filterIdsByKabupatenScope(ids: string[], scope: string[]): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("schedules")
    .select("id")
    .in("id", ids)
    .in("kabupaten_id", scope.length > 0 ? scope : ["__none__"])
    .is("deleted_at", null);

  const allowed = new Set(data?.map((r) => r.id) ?? []);
  return ids.every((id) => allowed.has(id));
}
