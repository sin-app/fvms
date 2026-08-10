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
}

/**
 * Menyimpan foto kunjungan (blob) secara lokal + antrean upload.
 * Path storage menggunakan segmen pertama = userId agar lolos policy RLS storage.
 */
export async function queuePhotoUpload(
  payload: QueuePhotoPayload,
): Promise<OfflineVisitPhoto> {
  const db = getOfflineDb();
  const user = (await createClient().auth.getUser()).data.user;
  const ext = (payload.mimeType.split("/")[1] ?? "jpg").replace(/^jpeg$/, "jpg");
  const photoId = randomUUID();
  const url = `${user?.id ?? "anonymous"}/visits/${payload.scheduleId}/${photoId}.${ext}`;

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