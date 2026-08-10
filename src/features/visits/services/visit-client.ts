import {
  getOfflineDb,
  type OfflineVisitNote,
  type OfflineVisitPhoto,
  type OutboxEntry,
} from "@/lib/offline/db";
import { notifyOutboxChanged } from "@/lib/offline/sync-context";
import { createClient } from "@/lib/supabase/client";
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
}

const FINAL_STATUSES = ["completed", "gagal_total"];

/**
 * Mengupdate status/label/GPS secara lokal + antrean sinkron.
 * Status final (completed/gagal_total) wajib online — dilempar error lokal.
 */
export async function queueScheduleUpdate(payload: QueueSchedulePayload): Promise<void> {
  if (payload.status && FINAL_STATUSES.includes(payload.status)) {
    throw new Error("Status final hanya bisa diubah saat online");
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