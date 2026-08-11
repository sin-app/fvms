import {
  getOfflineDb,
  type OfflineVisitNote,
  type OfflineVisitPhoto,
  type OutboxEntry,
} from "@/lib/offline/db";
import { notifyOutboxChanged } from "@/lib/offline/sync-context";
import { createClient } from "@/lib/supabase/client";
import { deriveScheduleStatus } from "@/features/panen/services/panen-logic";
import { dateString } from "@/lib/utils/date";
import { randomUUID } from "./random-uuid";

export interface QueueNotePayload {
  schedule_id: string;
  observation?: string | null;
  problem?: string | null;
  recommend?: string | null;
  additional?: string | null;
}

/**
 * Menyimpan catatan kunjungan secara lokal lalu mengantrekannya ke outbox.
 * Aman dipanggil online maupun offline; sinkron terjadi via SyncProvider.
 */
export async function queueVisitNotesUpdate(
  payload: QueueNotePayload,
): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.visitNotes, db.outbox, async () => {
    await db.visitNotes.put({
      schedule_id: payload.schedule_id,
      observation: payload.observation ?? null,
      problem: payload.problem ?? null,
      recommend: payload.recommend ?? null,
      additional: payload.additional ?? null,
      updated_at: new Date().toISOString(),
    });

    const entry: OutboxEntry = {
      id: randomUUID(),
      table: "visit_notes",
      action: "upsert",
      entity_id: payload.schedule_id,
      payload: {
        schedule_id: payload.schedule_id,
        observation: payload.observation ?? null,
        problem: payload.problem ?? null,
        recommend: payload.recommend ?? null,
        additional: payload.additional ?? null,
      },
      created_at: Date.now(),
      attempts: 0,
      last_error: null,
    };
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

export interface QueuePhotoPayload {
  scheduleId: string;
  blob: Blob;
  mimeType: string;
  caption?: string | null;
  /** Override userId (dipakai test); default: user auth saat ini. */
  userId?: string;
}

async function currentUserId(): Promise<string | null> {
  try {
    const user = (await createClient().auth.getUser()).data.user;
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export type OfflineUserRole = "admin" | "qc" | "produksi";

/** Role dari JWT app_metadata; default produksi. */
async function currentRole(): Promise<OfflineUserRole> {
  try {
    const user = (await createClient().auth.getUser()).data.user;
    const role = (user?.app_metadata as { role?: string } | undefined)?.role;
    return role === "admin" || role === "qc" ? role : "produksi";
  } catch {
    return "produksi";
  }
}

/** Status yang hanya boleh ditetapkan QC/admin (verifikasi selesai). */
export function canSetCompleted(role: OfflineUserRole | string | null | undefined): boolean {
  return role === "admin" || role === "qc";
}

/**
 * Menyimpan foto kunjungan (blob) secara lokal + antrean upload.
 * Path storage menggunakan segmen pertama = userId agar lolos policy RLS storage.
 */
export async function queuePhotoUpload(
  payload: QueuePhotoPayload,
): Promise<OfflineVisitPhoto> {
  const db = getOfflineDb();
  const uid = payload.userId ?? (await currentUserId());
  const ext = (payload.mimeType.split("/")[1] ?? "jpg").replace(/^jpeg$/, "jpg");
  const photoId = randomUUID();
  const url = `${uid ?? "anonymous"}/visits/${payload.scheduleId}/${photoId}.${ext}`;

  const photo: OfflineVisitPhoto = {
    id: photoId,
    schedule_id: payload.scheduleId,
    url,
    caption: payload.caption ?? null,
    file_size: payload.blob.size,
    mime_type: payload.mimeType,
    created_at: new Date().toISOString(),
    blob: payload.blob,
  };

  await db.transaction("rw", db.visitPhotos, db.outbox, async () => {
    await db.visitPhotos.put(photo);
    const entry: OutboxEntry = {
      id: randomUUID(),
      table: "visit_photos",
      action: "upsert",
      entity_id: photoId,
      payload: {
        id: photoId,
        schedule_id: payload.scheduleId,
        url,
        caption: photo.caption,
        file_size: photo.file_size,
        mime_type: photo.mime_type,
      },
      created_at: Date.now(),
      attempts: 0,
      last_error: null,
    };
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
  return photo;
}

/** Menghapus foto kunjungan: lokal segera, server saat sinkron berikutnya. */
export async function queuePhotoDelete(photoId: string): Promise<void> {
  const db = getOfflineDb();
  const photo = await db.visitPhotos.get(photoId);
  if (!photo) return;

  await db.transaction("rw", db.visitPhotos, db.outbox, async () => {
    await db.visitPhotos.delete(photoId);
    await db.outbox.put({
      id: randomUUID(),
      table: "visit_photos",
      action: "delete",
      entity_id: photoId,
      payload: { id: photoId, url: photo.url, schedule_id: photo.schedule_id },
      created_at: Date.now(),
      attempts: 0,
      last_error: null,
    } satisfies OutboxEntry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

export interface QueueSchedulePayload {
  id: string;
  status?: string;
  label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  visit_time?: string | null;
  /** Override role (dipakai test); default: dari auth saat ini. */
  role?: OfflineUserRole;
}

/**
 * Mengupdate status/label/GPS secara lokal + antrean sinkron.
 * - completed: hanya QC/admin (produksi ditolak).
 * - gagal_total: wajib online (status final tanpa verifikasi offline).
 */
export async function queueScheduleUpdate(payload: QueueSchedulePayload): Promise<void> {
  const role = payload.role ?? (await currentRole());

  if (payload.status) {
    if (payload.status === "gagal_total") {
      throw new Error("Status gagal_total hanya bisa diubah saat online");
    }
    if (payload.status === "completed" && !canSetCompleted(role)) {
      throw new Error("Hanya QC yang dapat menandai selesai (completed)");
    }
  }

  const db = getOfflineDb();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const entryPayload: Record<string, unknown> = {};
  for (const key of ["status", "label", "latitude", "longitude", "accuracy", "visit_time"] as const) {
    if (payload[key] !== undefined) {
      patch[key] = payload[key];
      entryPayload[key] = payload[key];
    }
  }

  const entry: OutboxEntry = {
    id: randomUUID(),
    table: "schedules",
    action: "upsert",
    entity_id: payload.id,
    payload: entryPayload,
    created_at: Date.now(),
    attempts: 0,
    last_error: null,
  };

  await db.transaction("rw", db.schedules, db.outbox, async () => {
    await db.schedules.update(payload.id, patch);
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

/** Menggeser tanggal kunjungan secara lokal + antrean sinkron. */
export async function queueScheduleShift(scheduleId: string, days: number): Promise<void> {
  if (!Number.isInteger(days) || days === 0) {
    throw new Error("Jumlah hari tidak valid");
  }

  const db = getOfflineDb();
  const row = await db.schedules.get(scheduleId);
  if (!row?.visit_date) throw new Error("Jadwal tidak ditemukan");

  const current = new Date(row.visit_date + "T00:00:00");
  if (Number.isNaN(current.getTime())) throw new Error("Tanggal jadwal tidak valid");
  current.setDate(current.getDate() + days);
  const nextDate = dateString(current);

  const entry: OutboxEntry = {
    id: randomUUID(),
    table: "schedules",
    action: "shift",
    entity_id: scheduleId,
    payload: { days },
    created_at: Date.now(),
    attempts: 0,
    last_error: null,
  };

  await db.transaction("rw", db.schedules, db.outbox, async () => {
    await db.schedules.update(scheduleId, { visit_date: nextDate, updated_at: new Date().toISOString() });
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

/** Menghapus jadwal (soft delete) secara lokal + antrean sinkron. */
export async function queueScheduleDelete(scheduleId: string): Promise<void> {
  const db = getOfflineDb();

  const entry: OutboxEntry = {
    id: randomUUID(),
    table: "schedules",
    action: "delete",
    entity_id: scheduleId,
    payload: {},
    created_at: Date.now(),
    attempts: 0,
    last_error: null,
  };

  await db.transaction("rw", db.schedules, db.outbox, async () => {
    await db.schedules.delete(scheduleId);
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

export interface QueuePanenPayload {
  scheduleId: string;
  tgl_panen?: string | null;
  panen_keterangan?: string | null;
  /** Override role (dipakai test); default: dari auth saat ini. */
  role?: OfflineUserRole;
}

/**
 * Menyimpan data panen secara lokal + antrean sinkron.
 * QC/admin: tgl_panen otomatis menetapkan status completed.
 * Produksi : data panen disimpan tanpa auto-complete (completed hanya QC/admin).
 */
export async function queuePanenSave(payload: QueuePanenPayload): Promise<void> {
  const role = payload.role ?? (await currentRole());
  const db = getOfflineDb();
  const row = await db.schedules.get(payload.scheduleId);
  if (!row) throw new Error("Jadwal tidak ditemukan");

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const entryPayload: Record<string, unknown> = {};
  const tglPanen = payload.tgl_panen || null;
  const keterangan = payload.panen_keterangan || null;

  if (payload.tgl_panen !== undefined) {
    patch.tgl_panen = tglPanen;
    entryPayload.tgl_panen = tglPanen;
  }
  if (payload.panen_keterangan !== undefined) {
    patch.panen_keterangan = keterangan;
    entryPayload.panen_keterangan = keterangan;
  }

  const privileged = canSetCompleted(role);

  if (tglPanen && privileged) {
    patch.status = "completed";
    entryPayload._auto_complete = true;
  } else if (tglPanen === null) {
    const hasActivity = !!(row.visit_time || row.notes || row.latitude);
    const derived = deriveScheduleStatus({
      real_tanam_ha: row.real_tanam_ha ? Number(row.real_tanam_ha) : null,
      gagal_tanam: row.gagal_tanam ? Number(row.gagal_tanam) : null,
      sisa_di_lahan_ha: row.sisa_di_lahan_ha ? Number(row.sisa_di_lahan_ha) : null,
      hasActivity,
    });
    const derivedStatus = derived?.status;
    if (derivedStatus && (privileged || derivedStatus !== "completed")) {
      patch.status = derivedStatus;
      entryPayload.status = derivedStatus;
    }
  }

  const entry: OutboxEntry = {
    id: randomUUID(),
    table: "schedules",
    action: "upsert",
    entity_id: payload.scheduleId,
    payload: entryPayload,
    created_at: Date.now(),
    attempts: 0,
    last_error: null,
  };

  await db.transaction("rw", db.schedules, db.outbox, async () => {
    await db.schedules.update(payload.scheduleId, patch);
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

/** Mengubah keterangan foto secara lokal + antrean sinkron. */
export async function queuePhotoCaptionUpdate(
  photoId: string,
  scheduleId: string,
  caption: string,
): Promise<void> {
  const db = getOfflineDb();
  const photo = await db.visitPhotos.get(photoId);
  if (!photo) throw new Error("Foto tidak ditemukan");

  const entry: OutboxEntry = {
    id: randomUUID(),
    table: "visit_photos",
    action: "upsert",
    entity_id: photoId,
    payload: {
      id: photoId,
      schedule_id: scheduleId,
      url: photo.url,
      caption,
      file_size: photo.file_size,
      mime_type: photo.mime_type,
    },
    created_at: Date.now(),
    attempts: 0,
    last_error: null,
  };

  await db.transaction("rw", db.visitPhotos, db.outbox, async () => {
    await db.visitPhotos.update(photoId, { caption });
    await db.outbox.put(entry);
  });
  await notifyOutboxChanged(await db.outbox.count());
}

export interface OfflineVisitDetail {
  schedule: import("@/lib/offline/db").OfflineScheduleRow | undefined;
  notes: OfflineVisitNote | undefined;
  photos: OfflineVisitPhoto[];
}

/** Membaca detail kunjungan dari store lokal (online maupun offline). */
export async function getOfflineVisitDetail(
  scheduleId: string,
): Promise<OfflineVisitDetail> {
  const db = getOfflineDb();
  const [schedule, notes, photos] = await Promise.all([
    db.schedules.get(scheduleId),
    db.visitNotes.get(scheduleId),
    db.visitPhotos.where("schedule_id").equals(scheduleId).toArray(),
  ]);
  return { schedule, notes, photos };
}

export function offlinePhotoObjectUrl(photo: OfflineVisitPhoto): string | null {
  if (!photo.blob) return null;
  try {
    return URL.createObjectURL(photo.blob);
  } catch {
    return null;
  }
}