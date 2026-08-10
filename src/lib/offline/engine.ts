import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOfflineDb,
  getMeta,
  setMeta,
  regionKey,
  type OfflineRegion,
  type OfflineScheduleRow,
  type OfflineVisitNote,
  type OfflineVisitPhoto,
  type OutboxEntry,
} from "./db";

export interface SyncUserContext {
  id: string;
  role: "admin" | "qc" | "produksi";
  assignedKabupatenIds: string[];
}

/** Membangun konteks sinkron dari user auth (role default produksi). */
export function syncUserContext(user: {
  id: string;
  role?: string | null;
  assigned_kabupaten_ids?: (string | null)[] | null;
}): SyncUserContext {
  const role = (user.role as SyncUserContext["role"]) ?? "produksi";
  return {
    id: user.id,
    role: role === "admin" || role === "qc" ? role : "produksi",
    assignedKabupatenIds: Array.isArray(user.assigned_kabupaten_ids)
      ? user.assigned_kabupaten_ids.filter((v): v is string => typeof v === "string")
      : [],
  };
}

export interface SyncOptions {
  supabase: SupabaseClient;
  user: SyncUserContext;
  /** Batas maksimum baris yang ditarik per tabel (keamanan payload). */
  limit?: number;
}

const DEFAULT_LIMIT = 20000;

export interface HydrateResult {
  schedules: number;
  visitNotes: number;
  regions: number;
  total: number;
}

const SCHEDULE_SELECT =
  "id, visit_date, user_id, kabupaten_id, kecamatan_id, desa_id, status, label, block_no, no_plot, member_name, document_no, nis, cgr, cgr_code, ph_tanah, tgl_tanam, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, detaseling, tgl_panen, real_panen, rencana_panen, varietas, updated_at, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name)";

/**
 * Menarik data terbaru sesuai scope peran pengguna ke IndexedDB lokal.
 * - admin   : semua schedules
 * - qc      : schedules dalam kabupaten tugasnya
 * - produksi: schedules miliknya sendiri
 * RLS SELECT yang sudah ada tetap menjadi pengaman tambahan.
 */
export async function hydrateOffline(opts: SyncOptions): Promise<HydrateResult> {
  const { supabase, user, limit = DEFAULT_LIMIT } = opts;

  const schedulesQuery = supabase
    .from("schedules")
    .select(SCHEDULE_SELECT)
    .is("deleted_at", null)
    .limit(limit);

  if (user.role === "produksi") {
    schedulesQuery.eq("user_id", user.id);
  } else if (user.role === "qc") {
    schedulesQuery.in(
      "kabupaten_id",
      user.assignedKabupatenIds.length > 0 ? user.assignedKabupatenIds : ["__none__"],
    );
  }

  const [{ data: scheduleRows, error: schedError }, notesRes, regionsRes] = await Promise.all([
    schedulesQuery,
    supabase
      .from("visit_notes")
      .select("schedule_id, observation, problem, recommend, additional, updated_at")
      .limit(limit),
    Promise.all([
      supabase.from("kabupaten").select("id, name").limit(limit),
      supabase.from("kecamatan").select("id, name, kabupaten_id").limit(limit),
      supabase.from("desa").select("id, name, kecamatan_id").limit(limit),
    ]),
  ]);

  if (schedError) throw schedError;

  const db = getOfflineDb();

  await db.transaction(
    "rw",
    db.schedules,
    db.visitNotes,
    db.regions,
    db.meta,
    async () => {
      await db.schedules.clear();
      await db.visitNotes.clear();
      await db.regions.clear();
    },
  );

  const scheduleRowsOut: OfflineScheduleRow[] = (scheduleRows ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const kab = (r.kabupaten as { name?: string } | null)?.name ?? null;
    const kec = (r.kecamatan as { name?: string } | null)?.name ?? null;
    const desa = (r.desa as { name?: string } | null)?.name ?? null;
    const u = (r.users as { name?: string } | null)?.name ?? null;
    const rest = { ...r };
    delete rest.kabupaten;
    delete rest.kecamatan;
    delete rest.desa;
    delete rest.users;
    return {
      ...(rest as unknown as OfflineScheduleRow),
      kabupaten_name: kab,
      kecamatan_name: kec,
      desa_name: desa,
      user_name: u,
    };
  });

  const notesRows = (notesRes.data ?? []) as unknown as OfflineVisitNote[];

  const regions: OfflineRegion[] = [
    ...((regionsRes[0].data ?? []) as { id: string; name: string }[]).map((r) => ({
      entity: "kabupaten" as const,
      id: r.id,
      name: r.name,
      parent_id: null,
    })),
    ...((regionsRes[1].data ?? []) as { id: string; name: string; kabupaten_id: string }[]).map((r) => ({
      entity: "kecamatan" as const,
      id: r.id,
      name: r.name,
      parent_id: r.kabupaten_id,
    })),
    ...((regionsRes[2].data ?? []) as { id: string; name: string; kecamatan_id: string }[]).map((r) => ({
      entity: "desa" as const,
      id: r.id,
      name: r.name,
      parent_id: r.kecamatan_id,
    })),
  ];

  await db.transaction(
    "rw",
    db.schedules,
    db.visitNotes,
    db.regions,
    db.meta,
    async () => {
      await db.schedules.bulkPut(scheduleRowsOut);
      await db.visitNotes.bulkPut(notesRows);
      await db.regions.bulkPut(regions.map((r) => ({ ...r, key: regionKey(r.entity, r.id) })));

      const now = new Date().toISOString();
      await setMeta(`watermark:schedules:${user.id}`, now);
      await setMeta(`watermark:visit_notes:${user.id}`, now);
      await setMeta(`watermark:regions:${user.id}`, now);
      await setMeta("last_sync_at", Date.now());
    },
  );

  return {
    schedules: scheduleRowsOut.length,
    visitNotes: (notesRes.data ?? []).length,
    regions: regionsRes.reduce((n, r) => n + (r.data ?? []).length, 0),
    total: scheduleRowsOut.length + (notesRes.data ?? []).length + regionsRes.reduce((n, r) => n + (r.data ?? []).length, 0),
  };
}

export interface PushResult {
  pushed: number;
  failed: number;
}

/**
 * Menjalankan antrian mutasi (outbox) ke server, satu per satu secara urut.
 * Baris yang berhasil dihapus; yang gagal disimpan dengan last_error + attempts.
 */
export async function pushOutbox(opts: SyncOptions): Promise<PushResult> {
  const { supabase } = opts;
  const db = getOfflineDb();
  const entries = await db.outbox.orderBy("created_at").toArray();

  let pushed = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await applyOutboxEntry(supabase, entry);
      await db.outbox.delete(entry.id);
      pushed += 1;
    } catch (error) {
      failed += 1;
      await db.outbox.put({
        ...entry,
        attempts: entry.attempts + 1,
        last_error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { pushed, failed };
}

async function applyOutboxEntry(
  supabase: SupabaseClient,
  entry: OutboxEntry,
): Promise<void> {
  const { table, action, entity_id: entityId, payload } = entry;

  if (table === "visit_notes" && action === "upsert") {
    const { error } = await supabase
      .from("visit_notes")
      .upsert(payload as Record<string, string | null>, { onConflict: "schedule_id" });
    if (error) throw new Error(`visit_notes: ${error.message}`);
    return;
  }

  if (table === "schedules" && action === "upsert") {
    const { error } = await supabase
      .from("schedules")
      .update(payload)
      .eq("id", entityId);
    if (error) throw new Error(`schedules: ${error.message}`);
    return;
  }

  if (table === "visit_photos") {
    if (action === "delete") {
      const photo = await dbVisitPhoto(entityId);
      if (photo?.url) {
        const { error: rmError } = await supabase.storage.from("visit-photos").remove([photo.url]);
        if (rmError) throw new Error(`storage remove: ${rmError.message}`);
      }
      const { error } = await supabase.from("visit_photos").delete().eq("id", entityId);
      if (error) throw new Error(`visit_photos delete: ${error.message}`);
      return;
    }

    if (action === "upsert") {
      const { schedule_id, url, caption, file_size, mime_type, id } = payload as {
        schedule_id: string;
        url: string;
        caption: string | null;
        file_size: number | null;
        mime_type: string | null;
        id: string;
      };
      const photo = await dbVisitPhoto(id);
      if (photo?.blob && url) {
        const { error: upError } = await supabase.storage
          .from("visit-photos")
          .upload(url, photo.blob, { upsert: true, contentType: photo.mime_type ?? "image/jpeg" });
        if (upError) throw new Error(`storage upload: ${upError.message}`);
      }
      const { error } = await supabase
        .from("visit_photos")
        .upsert(
          { id, schedule_id, url, caption, file_size, mime_type },
          { onConflict: "id" },
        );
      if (error) throw new Error(`visit_photos: ${error.message}`);
      return;
    }
  }

  throw new Error(`outbox: operasi tidak dikenal (${table}/${action})`);
}

async function dbVisitPhoto(id: string): Promise<OfflineVisitPhoto | undefined> {
  const db = getOfflineDb();
  return db.visitPhotos.get(id);
}

/** Jumlah entri outbox yang belum disinkronkan. */
export async function pendingOutboxCount(): Promise<number> {
  const db = getOfflineDb();
  return db.outbox.count();
}

/** Waktu sinkron terakhir yang berhasil (ms epoch), atau null bila belum pernah. */
export async function lastSyncAt(): Promise<number | null> {
  const value = await getMeta<number>("last_sync_at");
  return value ?? null;
}