import { getOfflineDb, type OfflineScheduleRow } from "./db";

/**
 * Write-through ke cache IndexedDB setelah mutasi online berhasil.
 * Tujuannya agar UI (yang membaca dari IDB via useLocalQuery) langsung
 * merefleksikan perubahan tanpa harus menekan tombol "Sinkron" manual.
 *
 * Semua fungsi bersifat best-effort: kegagalan tulis cache tidak boleh
 * membatalkan keberhasilan mutasi server.
 */

export async function cacheUpsertVisitNotes(input: {
  schedule_id: string;
  observation?: string | null;
  problem?: string | null;
  recommend?: string | null;
  additional?: string | null;
}): Promise<void> {
  try {
    await getOfflineDb().visitNotes.put({
      schedule_id: input.schedule_id,
      observation: input.observation ?? null,
      problem: input.problem ?? null,
      recommend: input.recommend ?? null,
      additional: input.additional ?? null,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // best-effort
  }
}

export async function cachePatchSchedule(
  id: string,
  patch: Partial<OfflineScheduleRow>,
): Promise<void> {
  try {
    const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of Object.keys(patch) as (keyof OfflineScheduleRow)[]) {
      const value = patch[key];
      if (value !== undefined) changes[key] = value;
    }
    await getOfflineDb().schedules.update(id, changes as Partial<OfflineScheduleRow>);
  } catch {
    // best-effort
  }
}

export async function cacheDeleteSchedule(id: string): Promise<void> {
  await cachePatchSchedule(id, { deleted_at: new Date().toISOString() });
}

export async function cacheRestoreSchedule(id: string): Promise<void> {
  await cachePatchSchedule(id, { deleted_at: null });
}

export async function cacheShiftScheduleDate(id: string, days: number): Promise<void> {
  try {
    const db = getOfflineDb();
    const row = await db.schedules.get(id);
    if (!row) return;
    const base = row.visit_date
      ? new Date(`${row.visit_date}T00:00:00`)
      : new Date();
    base.setDate(base.getDate() + days);
    await cachePatchSchedule(id, { visit_date: base.toISOString().slice(0, 10) });
  } catch {
    // best-effort
  }
}

export async function cacheApplyBulk(ids: string[], action: string): Promise<void> {
  for (const id of ids) {
    if (action === "delete") {
      await cacheDeleteSchedule(id);
    } else if (action === "shift_forward") {
      await cacheShiftScheduleDate(id, 1);
    } else if (action === "shift_backward") {
      await cacheShiftScheduleDate(id, -1);
    } else if (action === "approve") {
      await cachePatchSchedule(id, { status: "in_progress" });
    } else if (
      action === "pending" ||
      action === "in_progress" ||
      action === "gagal_partial" ||
      action === "completed" ||
      action === "gagal_total"
    ) {
      await cachePatchSchedule(id, { status: action });
    }
  }
}

export async function cacheDeletePhoto(photo_id: string): Promise<void> {
  try {
    await getOfflineDb().visitPhotos.delete(photo_id);
  } catch {
    // best-effort
  }
}

export async function cacheUpdatePhotoCaption(
  photo_id: string,
  caption: string,
): Promise<void> {
  try {
    await getOfflineDb().visitPhotos.update(photo_id, { caption });
  } catch {
    // best-effort
  }
}
