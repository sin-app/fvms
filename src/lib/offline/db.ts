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
  panen_keterangan: string | null;
  varietas: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  visit_time: string | null;
  notes: string | null;
  deleted_at?: string | null;
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

export interface OfflineActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface OfflineRegion {
  entity: "kabupaten" | "kecamatan" | "desa";
  id: string;
  name: string;
  parent_id: string | null;
}

export interface OfflineLandProposal {
  id: string;
  proposed_by: string | null;
  reviewed_by: string | null;
  kabupaten_id: string | null;
  kecamatan_id: string | null;
  desa_id: string | null;
  block_no: string | null;
  no_plot: string | null;
  document_no: string | null;
  member_name: string | null;
  cgr: string | null;
  cgr_code: string | null;
  nis: string | null;
  ph_tanah: number | null;
  real_tanam_ha: number | null;
  detaseling: string | null;
  tgl_tanam: string | null;
  rencana_panen: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  status: string;
  review_note: string | null;
  created_schedule_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OfflineLandProposalPhoto {
  id: string;
  proposal_id: string;
  url: string;
  thumbnail: string | null;
  caption: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  blob: Blob | null;
}

export interface OfflineNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface OfflineUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  assigned_kabupaten_ids: string[];
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OfflineExcelImport {
  id: string;
  user_id: string;
  filename: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  column_mapping: Record<string, unknown> | null;
  status: string;
  error_log: Record<string, unknown> | null;
  created_at: string;
}

export interface OutboxEntry {
  id: string;
  table:
    | "visit_notes"
    | "visit_photos"
    | "schedules"
    | "land_proposals"
    | "land_proposal_photos"
    | "notifications"
    | "users"
    | "kabupaten"
    | "kecamatan"
    | "desa"
    | "excel_imports";
  action: "upsert" | "delete" | "insert" | "shift";
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
  activityLogs!: Table<OfflineActivityLog, string>;
  landProposals!: Table<OfflineLandProposal, string>;
  landProposalPhotos!: Table<OfflineLandProposalPhoto, string>;
  notifications!: Table<OfflineNotification, string>;
  users!: Table<OfflineUser, string>;
  excelImports!: Table<OfflineExcelImport, string>;
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
    this.version(2).stores({
      schedules: "id, visit_date, status, kabupaten_id, user_id, updated_at",
      visitNotes: "schedule_id, updated_at",
      visitPhotos: "id, schedule_id, created_at",
      regions: "key, entity, id, parent_id",
      activityLogs: "id, created_at",
      outbox: "id, table, created_at, attempts",
      meta: "key",
    });
    this.version(3).stores({
      schedules: "id, visit_date, status, kabupaten_id, user_id, updated_at",
      visitNotes: "schedule_id, updated_at",
      visitPhotos: "id, schedule_id, created_at",
      regions: "key, entity, id, parent_id",
      activityLogs: "id, created_at",
      landProposals: "id, kabupaten_id, proposed_by, status, created_at, updated_at",
      landProposalPhotos: "id, proposal_id, created_at",
      notifications: "id, user_id, is_read, created_at",
      users: "id, role, is_active, email",
      excelImports: "id, user_id, created_at",
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
  await db.transaction(
    "rw",
    [
      db.schedules,
      db.visitNotes,
      db.visitPhotos,
      db.regions,
      db.activityLogs,
      db.landProposals,
      db.landProposalPhotos,
      db.notifications,
      db.users,
      db.excelImports,
      db.meta,
    ],
    async () => {
    await Promise.all([
      db.schedules.clear(),
      db.visitNotes.clear(),
      db.visitPhotos.clear(),
      db.regions.clear(),
      db.activityLogs.clear(),
      db.landProposals.clear(),
      db.landProposalPhotos.clear(),
      db.notifications.clear(),
      db.users.clear(),
      db.excelImports.clear(),
    ]);
    await db.meta.clear();
  });
}

/** Hapus seluruh cache service worker (Serwist) di browser. */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

export const OUTBOX_CHANGE_EVENT = "fvms:outbox";

/** Beri tahu UI bahwa jumlah mutasi lokal berubah (dipakai SyncProvider). */
export function notifyOutboxChanged(count: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OUTBOX_CHANGE_EVENT, { detail: { count } }));
}

export function outboxChangeEventName(): string {
  return OUTBOX_CHANGE_EVENT;
}

export type { FvmsOfflineDB as OfflineDatabase };