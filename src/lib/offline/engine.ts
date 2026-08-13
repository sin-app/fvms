import type { SupabaseClient } from "@supabase/supabase-js";
import { dateString } from "@/lib/utils/date";
import { getVarietasFromDocumentNo } from "@/lib/utils/varietas";
import {
  getOfflineDb,
  getMeta,
  setMeta,
  regionKey,
  type OfflineActivityLog,
  type OfflineRegion,
  type OfflineScheduleRow,
  type OfflineVisitNote,
  type OfflineVisitPhoto,
  type OfflineLandProposal,
  type OfflineLandProposalPhoto,
  type OfflineNotification,
  type OfflineUser,
  type OfflineExcelImport,
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
  /** Hanya dibutuhkan hydrateOffline; pushOutbox mengabaikan. */
  user?: SyncUserContext;
  limit?: number;
}

const DEFAULT_LIMIT = 20000;

export interface HydrateResult {
  schedules: number;
  visitNotes: number;
  regions: number;
  activityLogs: number;
  landProposals: number;
  notifications: number;
  users: number;
  excelImports: number;
  total: number;
}

const SCHEDULE_SELECT =
  "id, visit_date, user_id, kabupaten_id, kecamatan_id, desa_id, status, label, block_no, no_plot, member_name, document_no, nis, cgr, cgr_code, ph_tanah, tgl_tanam, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, detaseling, tgl_panen, real_panen, rencana_panen, panen_keterangan, latitude, longitude, accuracy, visit_time, notes, updated_at, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name)";

const LP_SELECT =
  "id, proposed_by, reviewed_by, kabupaten_id, kecamatan_id, desa_id, block_no, no_plot, document_no, member_name, cgr, cgr_code, nis, ph_tanah, real_tanam_ha, detaseling, tgl_tanam, rencana_panen, notes, status, review_note, created_schedule_id, created_at, updated_at, deleted_at";

/**
 * Menarik data terbaru sesuai scope peran pengguna ke IndexedDB lokal untuk
 * SELURUH modul (schedules, visit, lahan, notifikasi, users, master data,
 * import). RLS SELECT yang sudah ada tetap menjadi pengaman tambahan. Saat
 * user kembali online, SyncProvider memanggil ini secara otomatis.
 */
export async function hydrateOffline(opts: SyncOptions): Promise<HydrateResult> {
  const { supabase } = opts;
  const user = opts.user;
  if (!user) throw new Error("hydrateOffline: user wajib");
  const limit = opts.limit ?? DEFAULT_LIMIT;

  const BATCH = 1000;

  // ---- schedules (scoped) ----
  let scheduleRows: unknown[] = [];
  let from = 0;
  for (;;) {
    const schedulesQuery = supabase
      .from("schedules")
      .select(SCHEDULE_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + BATCH - 1);

    if (user.role === "produksi") {
      schedulesQuery.eq("user_id", user.id);
    } else if (user.role === "qc") {
      schedulesQuery.in(
        "kabupaten_id",
        user.assignedKabupatenIds.length > 0 ? user.assignedKabupatenIds : ["__none__"],
      );
    }

    const { data, error } = await schedulesQuery;
    if (error) throw error;
    if (!data || data.length === 0) break;
    scheduleRows = scheduleRows.concat(data);
    if (data.length < BATCH) break;
    from += BATCH;
    if (scheduleRows.length >= limit) break;
  }

  // ---- land_proposals (scoped) ----
  let lpRows: unknown[] = [];
  from = 0;
  for (;;) {
    const lpQuery = supabase
      .from("land_proposals")
      .select(LP_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, from + BATCH - 1);
    if (user.role === "produksi") {
      lpQuery.eq("proposed_by", user.id);
    } else if (user.role === "qc") {
      lpQuery.in(
        "kabupaten_id",
        user.assignedKabupatenIds.length > 0 ? user.assignedKabupatenIds : ["__none__"],
      );
    }
    const { data, error } = await lpQuery;
    if (error) throw error;
    if (!data || data.length === 0) break;
    lpRows = lpRows.concat(data);
    if (data.length < BATCH) break;
    from += BATCH;
    if (lpRows.length >= limit) break;
  }

  // ---- excel_imports (scoped) ----
  const excelQuery = supabase.from("excel_imports").select("*").order("created_at", { ascending: false }).limit(limit);
  if (user.role === "produksi") excelQuery.eq("user_id", user.id);

  // ---- notifications (milik user) ----
  const notifQuery = supabase
    .from("notifications")
    .select("id, user_id, title, message, type, is_read, link, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  // ---- users (admin/qc -> semua aktif; produksi -> diri sendiri) ----
  const usersQuery = supabase
    .from("users")
    .select(
      "id, email, name, role, avatar_url, phone, is_active, assigned_kabupaten_ids, last_login_at, created_at, updated_at, deleted_at",
    )
    .order("created_at", { ascending: true })
    .limit(limit);
  if (user.role === "produksi") usersQuery.eq("id", user.id);
  else usersQuery.eq("is_active", true);

  const activityQuery = supabase
    .from("activity_logs")
    .select("id, user_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (user.role === "produksi") activityQuery.eq("user_id", user.id);
  else if (user.role === "qc") activityQuery.eq("id", "__none__");

  const [notesRes, regionsRes, activityRes, notifRes, usersRes, excelRes] = await Promise.all([
    supabase
      .from("visit_notes")
      .select("schedule_id, observation, problem, recommend, additional, updated_at")
      .limit(limit),
    Promise.all([
      supabase.from("kabupaten").select("id, name").limit(limit),
      supabase.from("kecamatan").select("id, name, kabupaten_id").limit(limit),
      supabase.from("desa").select("id, name, kecamatan_id").limit(limit),
    ]),
    activityQuery,
    notifQuery,
    usersQuery,
    excelQuery,
  ]);

  const db = getOfflineDb();

  await db.transaction(
    "rw",
    [
      db.schedules,
      db.visitNotes,
      db.regions,
      db.activityLogs,
      db.landProposals,
      db.notifications,
      db.users,
      db.excelImports,
      db.meta,
    ],
    async () => {
      await db.schedules.clear();
      await db.visitNotes.clear();
      await db.regions.clear();
      await db.activityLogs.clear();
      await db.landProposals.clear();
      await db.notifications.clear();
      await db.users.clear();
      await db.excelImports.clear();
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
      varietas: getVarietasFromDocumentNo(typeof r.document_no === "string" ? r.document_no : null),
    };
  });

  const lpRowsOut: OfflineLandProposal[] = (lpRows ?? []).map(
    (row) => ({ ...(row as unknown as OfflineLandProposal) }) as OfflineLandProposal,
  );

  const notesRows = (notesRes.data ?? []) as unknown as OfflineVisitNote[];
  const activityRows = (activityRes.data ?? []) as unknown as OfflineActivityLog[];
  const notifRows = (notifRes.data ?? []) as unknown as OfflineNotification[];
  const userRows = (usersRes.data ?? []) as unknown as OfflineUser[];
  const excelRows = (excelRes.data ?? []) as unknown as OfflineExcelImport[];

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
    [
      db.schedules,
      db.visitNotes,
      db.regions,
      db.activityLogs,
      db.landProposals,
      db.notifications,
      db.users,
      db.excelImports,
      db.meta,
    ],
    async () => {
      await db.schedules.bulkPut(scheduleRowsOut);
      await db.visitNotes.bulkPut(notesRows);
      await db.regions.bulkPut(regions.map((r) => ({ ...r, key: regionKey(r.entity, r.id) })));
      await db.activityLogs.bulkPut(activityRows);
      await db.landProposals.bulkPut(lpRowsOut);
      await db.notifications.bulkPut(notifRows);
      await db.users.bulkPut(userRows);
      await db.excelImports.bulkPut(excelRows);

      const now = new Date().toISOString();
      await setMeta(`watermark:schedules:${user.id}`, now);
      await setMeta(`watermark:visit_notes:${user.id}`, now);
      await setMeta(`watermark:regions:${user.id}`, now);
      await setMeta(`watermark:land_proposals:${user.id}`, now);
      await setMeta(`watermark:notifications:${user.id}`, now);
      await setMeta(`watermark:users:${user.id}`, now);
      await setMeta(`watermark:excel_imports:${user.id}`, now);
      await setMeta("last_sync_at", Date.now());
    },
  );

  return {
    schedules: scheduleRowsOut.length,
    visitNotes: (notesRes.data ?? []).length,
    regions: regionsRes.reduce((n, r) => n + (r.data ?? []).length, 0),
    activityLogs: activityRows.length,
    landProposals: lpRowsOut.length,
    notifications: notifRows.length,
    users: userRows.length,
    excelImports: excelRows.length,
    total:
      scheduleRowsOut.length +
      (notesRes.data ?? []).length +
      regionsRes.reduce((n, r) => n + (r.data ?? []).length, 0) +
      activityRows.length +
      lpRowsOut.length +
      notifRows.length +
      userRows.length +
      excelRows.length,
  };
}

export interface PushResult {
  pushed: number;
  failed: number;
}

/**
 * Menjalankan antrian mutasi (outbox) ke server, satu per satu secara urut.
 * Berlaku untuk SELURUH modul. Baris berhasil dihapus; gagal disimpan dengan
 * last_error + attempts. Dipanggil otomatis saat user online.
 */
export async function pushOutbox(opts: SyncOptions): Promise<PushResult> {
  const { supabase } = opts;
  const db = getOfflineDb();
  const entries = await db.outbox.orderBy("created_at").toArray();

  let pushed = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      await applyOutboxEntry(supabase, entry, opts.user);
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

/** Enqueue sebuah mutasi lokal ke antrian outbox (dipanggil service saat offline). */
export async function queueMutation(
  entry: Omit<OutboxEntry, "created_at" | "attempts" | "last_error" | "id"> &
    Partial<Pick<OutboxEntry, "created_at" | "attempts" | "last_error" | "id">>,
): Promise<void> {
  const db = getOfflineDb();
  await db.outbox.put({
    attempts: 0,
    last_error: null,
    created_at: Date.now(),
    ...entry,
    id: entry.id ?? crypto.randomUUID(),
  });
}

function pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of keys) {
    if (obj[key] !== undefined) row[key] = obj[key];
  }
  return row;
}

async function applyOutboxEntry(
  supabase: SupabaseClient,
  entry: OutboxEntry,
  user?: SyncUserContext,
): Promise<void> {
  const { table, action, entity_id: entityId, payload } = entry;

  if (table === "visit_notes" && action === "upsert") {
    const { error } = await supabase
      .from("visit_notes")
      .upsert(payload as Record<string, string | null>, { onConflict: "schedule_id" });
    if (error) throw new Error(`visit_notes: ${error.message}`);
    return;
  }

  if (table === "schedules" && action === "insert") {
    const allowed = [
      "id", "user_id", "visit_date", "kabupaten_id", "kecamatan_id", "desa_id",
      "status", "label", "block_no", "no_plot", "member_name", "document_no", "nis",
      "cgr", "cgr_code", "ph_tanah", "tgl_tanam", "real_tanam_ha", "gagal_tanam",
      "sisa_di_lahan_ha", "detaseling", "tgl_panen", "real_panen", "rencana_panen",
      "panen_keterangan", "notes",
    ];
    const row: Record<string, unknown> = pick(payload, allowed);
    if (!Object.keys(row).length) throw new Error("schedules: payload kosong");
    const { error } = await supabase.from("schedules").insert(row);
    if (error) throw new Error(`schedules insert: ${error.message}`);
    return;
  }

  if (table === "schedules" && action === "delete") {
    const { error } = await supabase
      .from("schedules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", entityId);
    if (error) throw new Error(`schedules delete: ${error.message}`);
    return;
  }

  if (table === "schedules" && action === "shift") {
    const days = Number((payload as { days?: unknown }).days);
    if (!Number.isInteger(days) || days === 0) {
      throw new Error("schedules: shift days tidak valid");
    }
    const { data, error: fetchError } = await supabase
      .from("schedules")
      .select("visit_date")
      .eq("id", entityId)
      .maybeSingle();
    if (fetchError) throw new Error(`schedules shift fetch: ${fetchError.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.visit_date) throw new Error("schedules: jadwal tidak ditemukan");
    const current = new Date(String(row.visit_date) + "T00:00:00");
    if (Number.isNaN(current.getTime())) throw new Error("schedules: tanggal tidak valid");
    current.setDate(current.getDate() + days);
    const { error } = await supabase
      .from("schedules")
      .update({ visit_date: dateString(current) })
      .eq("id", entityId);
    if (error) throw new Error(`schedules shift: ${error.message}`);
    return;
  }

  if (table === "schedules" && action === "upsert") {
    const p = payload as Record<string, unknown>;
    if (p._auto_complete === true && user && user.role !== "produksi") {
      p.status = "completed";
    }
    const targetStatus = typeof p.status === "string" ? p.status : undefined;
    if (targetStatus === "gagal_total") {
      throw new Error("schedules: status final hanya lewat koneksi online");
    }
    if (targetStatus === "completed" && user && user.role === "produksi") {
      throw new Error("schedules: completed hanya untuk QC/admin");
    }
    const allowed = [
      "status", "label", "latitude", "longitude", "accuracy", "visit_time",
      "visit_date", "tgl_panen", "real_panen", "rencana_panen", "panen_keterangan",
    ];
    const update: Record<string, unknown> = pick(p, allowed);
    if (!Object.keys(update).length) throw new Error("schedules: payload kosong");
    const { error } = await supabase
      .from("schedules")
      .update(update)
      .eq("id", entityId);
    if (error) throw new Error(`schedules: ${error.message}`);
    return;
  }

  if (table === "visit_photos") {
    if (action === "delete") {
      const photo = await dbVisitPhoto(entityId);
      const objectUrl = photo?.url ?? (payload as { url?: string }).url;
      if (objectUrl) {
        const { error: rmError } = await supabase.storage.from("visit-photos").remove([objectUrl]);
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

  // ---- land_proposals ----
  if (table === "land_proposals" && action === "insert") {
    if (user && !(user.role === "produksi" || user.role === "admin")) {
      throw new Error("land_proposals: insert hanya produksi/admin");
    }
    const allowed = [
      "id", "proposed_by", "kabupaten_id", "kecamatan_id", "desa_id", "block_no",
      "no_plot", "document_no", "member_name", "cgr", "cgr_code", "nis", "ph_tanah",
      "real_tanam_ha", "detaseling", "tgl_tanam", "rencana_panen", "notes", "status",
      "latitude", "longitude", "accuracy",
    ];
    const row: Record<string, unknown> = pick(payload, allowed);
    if (!Object.keys(row).length) throw new Error("land_proposals: payload kosong");
    const { error } = await supabase.from("land_proposals").insert(row);
    if (error) throw new Error(`land_proposals insert: ${error.message}`);
    return;
  }

  if (table === "land_proposals" && action === "upsert") {
    if (user && !(user.role === "qc" || user.role === "admin" || user.role === "produksi")) {
      throw new Error("land_proposals: akses ditolak");
    }
    const allowed = [
      "status", "review_note", "reviewed_by", "block_no", "no_plot", "member_name",
      "document_no", "nis", "ph_tanah", "real_tanam_ha", "detaseling", "tgl_tanam",
      "rencana_panen", "notes", "latitude", "longitude", "accuracy",
    ];
    const row: Record<string, unknown> = pick(payload, allowed);
    if (!Object.keys(row).length) throw new Error("land_proposals: payload kosong");
    const { error } = await supabase.from("land_proposals").update(row).eq("id", entityId);
    if (error) throw new Error(`land_proposals update: ${error.message}`);
    return;
  }

  if (table === "land_proposals" && action === "delete") {
    if (user && user.role !== "admin") throw new Error("land_proposals: delete hanya admin");
    const { error } = await supabase
      .from("land_proposals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", entityId);
    if (error) throw new Error(`land_proposals delete: ${error.message}`);
    return;
  }

  // ---- land_proposal_photos ----
  if (table === "land_proposal_photos") {
    if (action === "delete") {
      const photo = await dbLandProposalPhoto(entityId);
      const objectUrl = photo?.url ?? (payload as { url?: string }).url;
      if (objectUrl) {
        const { error: rmError } = await supabase.storage.from("visit-photos").remove([objectUrl]);
        if (rmError) throw new Error(`storage remove: ${rmError.message}`);
      }
      const { error } = await supabase.from("land_proposal_photos").delete().eq("id", entityId);
      if (error) throw new Error(`land_proposal_photos delete: ${error.message}`);
      return;
    }
    if (action === "upsert") {
      const { proposal_id, url, caption, file_size, mime_type, id, thumbnail } = payload as {
        proposal_id: string;
        url: string;
        caption: string | null;
        file_size: number | null;
        mime_type: string | null;
        id: string;
        thumbnail?: string | null;
      };
      const photo = await dbLandProposalPhoto(id);
      if (photo?.blob && url) {
        const { error: upError } = await supabase.storage
          .from("visit-photos")
          .upload(url, photo.blob, { upsert: true, contentType: photo.mime_type ?? "image/jpeg" });
        if (upError) throw new Error(`storage upload: ${upError.message}`);
      }
      const { error } = await supabase
        .from("land_proposal_photos")
        .upsert(
          { id, proposal_id, url, caption, file_size, mime_type, thumbnail },
          { onConflict: "id" },
        );
      if (error) throw new Error(`land_proposal_photos: ${error.message}`);
      return;
    }
  }

  // ---- notifications (klien menandai sudah dibaca) ----
  if (table === "notifications" && action === "upsert") {
    const allowed = ["is_read"];
    const row: Record<string, unknown> = pick(payload, allowed);
    const { error } = await supabase.from("notifications").update(row).eq("id", entityId);
    if (error) throw new Error(`notifications update: ${error.message}`);
    return;
  }

  // ---- users (hanya admin) ----
  if (table === "users") {
    if (!user || user.role !== "admin") throw new Error("users: hanya admin");
    if (action === "delete") {
      const { error } = await supabase
        .from("users")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", entityId);
      if (error) throw new Error(`users delete: ${error.message}`);
      return;
    }
    const allowed = ["id", "email", "name", "role", "phone", "is_active", "assigned_kabupaten_ids", "avatar_url"];
    const row: Record<string, unknown> = pick(payload, allowed);
    const { error } = await supabase.from("users").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`users: ${error.message}`);
    return;
  }

  // ---- master data kabupaten/kecamatan/desa (hanya admin) ----
  if (table === "kabupaten" || table === "kecamatan" || table === "desa") {
    if (!user || user.role !== "admin") throw new Error(`${table}: hanya admin`);
    if (action === "delete") {
      const { error } = await supabase
        .from(table)
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", entityId);
      if (error) throw new Error(`${table} delete: ${error.message}`);
      return;
    }
    const allowed =
      table === "kabupaten"
        ? ["id", "name", "code", "is_active"]
        : table === "kecamatan"
          ? ["id", "kabupaten_id", "name", "code", "is_active"]
          : ["id", "kecamatan_id", "name", "code", "is_active"];
    const row: Record<string, unknown> = pick(payload, allowed);
    const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
    return;
  }

  // ---- excel_imports (hanya admin) ---
  if (table === "excel_imports") {
    if (!user || user.role !== "admin") throw new Error("excel_imports: hanya admin");
    const allowed = ["id", "user_id", "filename", "total_rows", "success_rows", "error_rows", "column_mapping", "status", "error_log"];
    const row: Record<string, unknown> = pick(payload, allowed);
    const { error } = await supabase.from("excel_imports").insert(row);
    if (error) throw new Error(`excel_imports: ${error.message}`);
    return;
  }

  throw new Error(`outbox: operasi tidak dikenal (${table}/${action})`);
}

async function dbVisitPhoto(id: string): Promise<OfflineVisitPhoto | undefined> {
  const db = getOfflineDb();
  return db.visitPhotos.get(id);
}

async function dbLandProposalPhoto(id: string): Promise<OfflineLandProposalPhoto | undefined> {
  const db = getOfflineDb();
  return db.landProposalPhotos.get(id);
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
