import Dexie, { type Table } from "dexie";

export interface OfflineScheduleRow {
  id: string;
  visit_date: string;
  user_id: string | null;
  kabupaten_id: string | null;
  kecamatan_id: string | null;
  desa_id: string | null;
  status: string;
  label: string | null;
  block_no: string | null;
  no_plot: string | null;
  member_name: string | null;
  document_no: string | null;
  nis: string | null;
  cgr: string | null;
  cgr_code: string | null;
  ph_tanah: string | null;
  tgl_tanam: string | null;
  real_tanam_ha: string | null;
  gagal_tanam: string | null;
  sisa_di_lahan_ha: string | null;
  detaseling: string | null;
  tgl_panen: string | null;
  real_panen: string | null;
  rencana_panen: string | null;
  varietas: string | null;
  updated_at: string;
  kabupaten_name?: string | null;
  kecamatan_name?: string | null;
  desa_name?: string | null;
  user_name?: string | null;
}

export interface OfflineVisitNote {
  schedule_id: string;
  observation: string | null;
  problem: string | null;
  recommend: string | null;
  additional: string | null;
  updated_at: string;
}

export interface OfflineVisitPhoto {
  id: string;
  schedule_id: string;
  url: string;
  caption: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  blob: Blob | null;
}

export interface OfflineRegion {
  entity: "kabupaten" | "kecamatan" | "desa";
  id: string;
  name: string;
  parent_id: string | null;
}

export interface OutboxEntry {
  id: string;
  table: "visit_notes" | "visit_photos" | "schedules";
  action: "upsert" | "delete";
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: number;
  attempts: number;
  last_error: string | null;
}

export type OfflineMetaKey =
  | "watermark:schedules"
  | "watermark:visit_notes"
  | "watermark:regions"
  | "last_sync_at";

export interface OfflineMeta {
  key: OfflineMetaKey | string;
  value: unknown;
}

export function regionKey(entity: OfflineRegion["entity"], id: string): string {
  return `${entity}:${id}`;
}

const DB_NAME = "fvms-offline";

class FvmsOfflineDB extends Dexie {
  schedules!: Table<OfflineScheduleRow, string>;
  visitNotes!: Table<OfflineVisitNote, string>;
  visitPhotos!: Table<OfflineVisitPhoto, string>;
  regions!: Table<OfflineRegion, string>;
  outbox!: Table<OutboxEntry, string>;
  meta!: Table<OfflineMeta, string>;

  constructor(dbName = DB_NAME) {
    super(dbName);
    this.version(1).stores({
      schedules: "id, visit_date, status, kabupaten_id, user_id, updated_at",
      visitNotes: "schedule_id, updated_at",
      visitPhotos: "id, schedule_id, created_at",
      regions: "key, entity, id, parent_id",
      outbox: "id, table, created_at, attempts",
      meta: "key",
    });
  }
}

let dbInstance: FvmsOfflineDB | null = null;

export function isOfflineDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getOfflineDb(dbName?: string): FvmsOfflineDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB tidak tersedia di lingkungan ini");
  }
  if (!dbInstance) {
    const db = new FvmsOfflineDB(dbName);
    db.on("versionchange", () => db.close());
    dbInstance = db;
  }
  return dbInstance;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = getOfflineDb();
  return (await db.meta.get(key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = getOfflineDb();
  await db.meta.put({ key, value });
}

export async function clearOfflineData(): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.schedules, db.visitNotes, db.visitPhotos, db.regions, db.meta, async () => {
    await Promise.all([
      db.schedules.clear(),
      db.visitNotes.clear(),
      db.visitPhotos.clear(),
      db.regions.clear(),
    ]);
    await db.meta.clear();
  });
}

export type { FvmsOfflineDB as OfflineDatabase };