import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";
import { logger } from "@/lib/logger";
import { backupSchema, MAX_BACKUP_BYTES, type BackupPayload } from "../schema/backup-schema";

const LIMIT = 20000;

/**
 * Membuat payload backup sesuai scope peran:
 * - produksi: schedules + notes + foto (metadata) miliknya
 * - qc      : schedules dalam kabupaten tugas + notes + foto (metadata)
 * - admin   : semua data operasional + master data + users
 */
export async function createBackupExport(): Promise<{ json: string; filename: string }> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const admin = createAdminClient();

  let scheduleQuery = admin
    .from("schedules")
    .select("*")
    .is("deleted_at", null)
    .limit(LIMIT);
  if (ctx.role === "produksi") {
    scheduleQuery = scheduleQuery.eq("user_id", ctx.userId);
  } else if (ctx.role === "qc") {
    scheduleQuery = scheduleQuery.in(
      "kabupaten_id",
      ctx.assignedKabupatenIds.length > 0 ? ctx.assignedKabupatenIds : ["__none__"],
    );
  }

  const { data: schedules, error: schedError } = await scheduleQuery;
  if (schedError) throw schedError;

  const scheduleIds = (schedules ?? []).map((s) => s.id as string);

  const [notesRes, photosRes, regionsRes, usersRes] = await Promise.all([
    scheduleIds.length > 0
      ? admin
          .from("visit_notes")
          .select("*")
          .in("schedule_id", scheduleIds)
          .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
    scheduleIds.length > 0
      ? admin
          .from("visit_photos")
          .select("*")
          .in("schedule_id", scheduleIds)
          .limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
    ctx.role === "admin"
      ? Promise.all([
          admin.from("kabupaten").select("*").limit(LIMIT),
          admin.from("kecamatan").select("*").limit(LIMIT),
          admin.from("desa").select("*").limit(LIMIT),
        ])
      : Promise.resolve([{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }]),
    ctx.role === "admin"
      ? admin.from("users").select("*").is("deleted_at", null).limit(LIMIT)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    role: ctx.role,
    data: {
      schedules: (schedules ?? []).map(pickScalars),
      visitNotes: ((notesRes as { data: unknown[] }).data ?? []).map(pickScalars),
      visitPhotos: ((photosRes as { data: unknown[] }).data ?? []).map(pickScalars),
    },
  };

  if (ctx.role === "admin") {
    payload.data.regions = {
      kabupaten: ((regionsRes as { data: unknown[] }[])[0].data ?? []).map(pickScalars),
      kecamatan: ((regionsRes as { data: unknown[] }[])[1].data ?? []).map(pickScalars),
      desa: ((regionsRes as { data: unknown[] }[])[2].data ?? []).map(pickScalars),
    };
    payload.data.users = ((usersRes as { data: unknown[] }).data ?? []).map(pickScalars);
  }

  const json = JSON.stringify(payload);
  return { json, filename: `fvms-backup-${new Date().toISOString().slice(0, 10)}.json` };
}

/** Hanya kolom skalar (tanpa relasi/objek bersarang) supaya JSON ringan & aman. */
function pickScalars(row: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

const SCHEDULE_UPSERT_COLUMNS = [
  "id", "user_id", "kabupaten_id", "kecamatan_id", "desa_id", "visit_date",
  "status", "label", "block_no", "no_plot", "member_name", "document_no", "nis",
  "cgr", "cgr_code", "ph_tanah", "tgl_tanam", "real_tanam_ha", "gagal_tanam",
  "sisa_di_lahan_ha", "detaseling", "tgl_panen", "real_panen", "rencana_panen",
  "panen_keterangan", "latitude", "longitude", "accuracy",
  "visit_time", "notes",
] as const;

const NOTE_UPSERT_COLUMNS = [
  "schedule_id", "observation", "problem", "recommend", "additional",
] as const;

const PHOTO_UPSERT_COLUMNS = [
  "id", "schedule_id", "url", "caption", "file_size", "mime_type",
] as const;

const REGION_UPSERT_COLUMNS = ["id", "name", "code", "is_active"] as const;

const USER_UPSERT_COLUMNS = [
  "id", "email", "name", "role", "phone", "is_active", "assigned_kabupaten_ids",
] as const;

function slice(row: Record<string, unknown>, columns: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    if (row[col] !== undefined) out[col] = row[col];
  }
  return out;
}

/**
 * Restore data dari file backup (admin-only, upsert, tidak menghapus apa pun).
 * Foto hanya metadata (path object) — file asli tidak ikut di backup.
 */
export async function restoreFromBackup(json: string): Promise<{ schedules: number; notes: number; photos: number; regions: number; users: number }> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");
  if (ctx.role !== "admin") throw new Error("Import backup hanya untuk admin");

  if (Buffer.byteLength(json, "utf8") > MAX_BACKUP_BYTES) {
    throw new Error("Ukuran backup melebihi 5MB");
  }

  const parsed = backupSchema.safeParse(JSON.parse(json));
  if (!parsed.success) {
    throw new Error("File backup tidak valid atau format tidak didukung");
  }

  const { data } = parsed;
  const admin = createAdminClient();
  const counts = { schedules: 0, notes: 0, photos: 0, regions: 0, users: 0 };

  if (data.data.schedules?.length) {
    const rows = data.data.schedules.map((r) => slice(r, SCHEDULE_UPSERT_COLUMNS));
    const { error } = await admin
      .from("schedules")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
    counts.schedules = rows.length;
  }

  if (data.data.visitNotes?.length) {
    const rows = data.data.visitNotes.map((r) => slice(r, NOTE_UPSERT_COLUMNS));
    const { error } = await admin
      .from("visit_notes")
      .upsert(rows, { onConflict: "schedule_id" });
    if (error) throw error;
    counts.notes = rows.length;
  }

  if (data.data.visitPhotos?.length) {
    const rows = data.data.visitPhotos.map((r) => slice(r, PHOTO_UPSERT_COLUMNS));
    const { error } = await admin
      .from("visit_photos")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
    counts.photos = rows.length;
  }

  if (data.data.regions) {
    const tables: { rows: unknown[]; table: "kabupaten" | "kecamatan" | "desa" }[] = [
      { rows: data.data.regions.kabupaten ?? [], table: "kabupaten" },
      { rows: data.data.regions.kecamatan ?? [], table: "kecamatan" },
      { rows: data.data.regions.desa ?? [], table: "desa" },
    ];
    for (const { rows, table } of tables) {
      if (!rows.length) continue;
      const clean = rows.map((r) => slice(r as Record<string, unknown>, REGION_UPSERT_COLUMNS));
      const { error } = await admin.from(table).upsert(clean, { onConflict: "id" });
      if (error) throw error;
      counts.regions += clean.length;
    }
  }

  if (data.data.users?.length) {
    const rows = data.data.users.map((r) => slice(r, USER_UPSERT_COLUMNS));
    const { error } = await admin
      .from("users")
      .upsert(rows, { onConflict: "id" });
    if (error) throw error;
    counts.users = rows.length;
  }

  logger.info("backup: restore selesai", { ...counts, by: ctx.userId });
  return counts;
}
