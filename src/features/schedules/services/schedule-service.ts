import { createAdminClient } from "@/lib/supabase/admin-client";
import { qcKabupatenScope } from "@/lib/auth/authorization";
import { todayString } from "@/lib/utils/date";
import { getPanenStatus } from "@/features/panen/services/panen-logic";
import type { AuthContext } from "@/lib/auth/authorization";
import type { Schedule } from "@/types";
import type { ScheduleFilters, ScheduleListResult, DistinctFiltersInput } from "../types";

// Escape LIKE wildcards so user input can't alter the match pattern.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

const MAX_EXPORT_ROWS = 10000;

function matchPanenStatus(row: Schedule, panenStatus: string): boolean {
  const { label } = getPanenStatus({
    tgl_panen: row.tgl_panen,
    real_panen: row.real_panen,
    rencana_panen: row.rencana_panen,
    tgl_tanam: row.tgl_tanam,
    cgr: row.cgr,
  });
  if (panenStatus === "sudah") return label === "Panen";
  if (panenStatus === "jatuh_tempo") return label === "Jatuh Tempo";
  if (panenStatus === "belum") return label !== "Panen" && label !== "Jatuh Tempo";
  return true;
}

function buildScheduleQuery(
  userId: string,
  filters: ScheduleFilters = {},
  ctx?: AuthContext,
) {
  const admin = createAdminClient();
  const {
    status,
    kabupaten_id,
    kecamatan_id,
    date_from,
    date_to,
    user_id,
    cgr,
  } = filters;

  const scope = ctx ? qcKabupatenScope(ctx) : null;

  let query = admin
    .from("schedules")
    .select(
      "*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)",
      { count: "planned" },
    );

  if (scope !== null) {
    // QC: restrict to assigned kabupaten. Empty assignment => no rows.
    query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
  }

  // Non-privileged callers are always scoped to their own schedules
  // and must not be able to filter by another user's id.
  if (userId !== "all") {
    query = query.eq("user_id", userId);
  } else if (user_id) {
    query = query.eq("user_id", user_id);
  }

  if (cgr) {
    query = query.eq("cgr", cgr);
  }

  if (filters.member_name && filters.member_name.trim()) {
    query = query.ilike("member_name", `%${escapeLike(filters.member_name.trim())}%`);
  }

  if (filters.block_no && filters.block_no.length > 0) {
    query = query.in("block_no", filters.block_no.map((b) => b.trim()));
  }

  if (filters.no_plot && filters.no_plot.trim()) {
    query = query.eq("no_plot", filters.no_plot.trim());
  }

  if (filters.nis && filters.nis.trim()) {
    query = query.eq("nis", filters.nis.trim());
  }

  if (filters.document_no && filters.document_no.trim()) {
    query = query.eq("document_no", filters.document_no.trim());
  }

  if (status && status !== "all") {
    if (status === "late") {
      query = query
        .lt("visit_date", todayString())
        .not("status", "in", "(completed,gagal_partial,gagal_total)");
    } else {
      query = query.eq("status", status);
    }
  }

  if (kabupaten_id) query = query.eq("kabupaten_id", kabupaten_id);
  if (kecamatan_id) query = query.eq("kecamatan_id", kecamatan_id);
  if (filters.desa_id) query = query.eq("desa_id", filters.desa_id);

  if (filters.varietas && filters.varietas.trim()) {
    // document_no format: KJP/<VARIETAS>/<...>; match the 2nd segment.
    query = query.like("document_no", `%/${escapeLike(filters.varietas.trim())}/%`);
  }

  if (filters.label) {
    if (filters.label === "all") {
      // no filter
    } else if (filters.label === "ada") {
      query = query.not("label", "is", null);
    } else {
      query = query.eq("label", filters.label);
    }
  }

  if (date_from && date_to) {
    query = query.gte("visit_date", date_from).lte("visit_date", date_to);
  } else if (date_from) {
    query = query.gte("visit_date", date_from);
  } else if (date_to) {
    query = query.lte("visit_date", date_to);
  }

  return { query, admin };
}

export async function getScheduleList(
  userId: string,
  filters: ScheduleFilters = {},
  ctx?: AuthContext,
): Promise<ScheduleListResult> {
  const {
    page = 1,
    pageSize = 20,
  } = filters;

  const panenStatus =
    filters.panen_status && filters.panen_status !== "all" ? filters.panen_status : null;

  const showDeleted = filters.includeDeleted === true && ctx?.role === "admin";

  const { query: baseQuery } = buildScheduleQuery(userId, filters, ctx);

  let query = baseQuery;
  query = (showDeleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null))
    .order("visit_date", { ascending: true });

  if (panenStatus) {
    // Panen status is derived (rencana_panen may be computed from tgl_tanam + cgr),
    // so candidates are fetched fully then filtered + paginated in memory.
    query = query.limit(MAX_EXPORT_ROWS);
    const { data, error } = await query;
    if (error) throw error;

    const filtered = ((data ?? []) as unknown as Schedule[]).filter((s) =>
      matchPanenStatus(s, panenStatus),
    );

    const from = (page - 1) * pageSize;
    return {
      data: filtered.slice(from, from + pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
     
    data: (data ?? []) as unknown as Schedule[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function getScheduleRowsForExport(
  userId: string,
  filters: ScheduleFilters = {},
  ctx?: AuthContext,
): Promise<Schedule[]> {
  const panenStatus =
    filters.panen_status && filters.panen_status !== "all" ? filters.panen_status : null;

  const showDeleted = filters.includeDeleted === true && ctx?.role === "admin";

  const { query } = buildScheduleQuery(userId, filters, ctx);

  let exportQuery = (showDeleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null))
    .order("visit_date", { ascending: true });
  if (panenStatus) exportQuery = exportQuery.limit(MAX_EXPORT_ROWS);

  const { data, error } = await exportQuery;

  if (error) throw error;

   
  const all = (data ?? []) as unknown as Schedule[];
  return panenStatus ? all.filter((s) => matchPanenStatus(s, panenStatus)) : all;
}

export async function getScheduleById(id: string): Promise<Schedule | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("schedules")
    .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email), visit_notes(*), visit_photos(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

   
  return data as unknown as Schedule | null;
}

export async function createSchedule(data: {
  user_id: string;
  kabupaten_id: string;
  kecamatan_id: string;
  desa_id: string;
  visit_date: string;
  notes?: string;
  cgr?: string;
  cgr_code?: string;
  block_no?: string;
  no_plot?: string;
  member_name?: string;
  document_no?: string;
  nis?: string;
  ph_tanah?: number;
  real_tanam_ha?: number;
  gagal_tanam?: number;
  detaseling?: string;
  sisa_di_lahan_ha?: number;
  tgl_tanam?: string;
  rencana_panen?: string;
  real_panen?: string;
  tgl_panen?: string;
  panen_keterangan?: string;
  status?: string;
}) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("schedules")
    .insert({ ...data, created_by: data.user_id, status: data.status || "pending" })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateSchedule(
  id: string,
  data: {
    kabupaten_id?: string;
    kecamatan_id?: string;
    desa_id?: string;
    visit_date?: string;
    notes?: string;
    cgr?: string;
    cgr_code?: string;
    block_no?: string;
    no_plot?: string;
    member_name?: string;
    document_no?: string;
    nis?: string;
    ph_tanah?: number;
    real_tanam_ha?: number;
    gagal_tanam?: number;
    detaseling?: string;
    sisa_di_lahan_ha?: number;
    tgl_tanam?: string;
    rencana_panen?: string;
    real_panen?: string;
    tgl_panen?: string;
    panen_keterangan?: string;
    status?: string;
  },
) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("schedules")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteSchedule(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("schedules")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function restoreSchedule(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("schedules")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) throw error;
}

export async function getCalendarEvents(
  userId: string,
  start: string,
  end: string,
  ctx?: AuthContext,
) {
  const admin = createAdminClient();
  const scope = ctx ? qcKabupatenScope(ctx) : null;
  let query = admin
    .from("schedules")
    .select("id, visit_date, status, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name)")
    .gte("visit_date", start)
    .lte("visit_date", end)
    .is("deleted_at", null);

  if (scope !== null) {
    query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
  }

  if (userId !== "all") {
    query = query.eq("user_id", userId);
  }

  const { data } = await query;
   
  return (data ?? []) as unknown as Schedule[];
}

export async function getScheduleOwnerIds(
  ids: string[],
): Promise<{ id: string; user_id: string }[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("schedules")
    .select("id, user_id")
    .in("id", ids)
    .is("deleted_at", null);

  return (data ?? []) as { id: string; user_id: string }[];
}

export const DISTINCT_FILTER_FIELDS = ["block_no", "no_plot", "nis", "document_no", "cgr"] as const;

export type DistinctFilterField = (typeof DISTINCT_FILTER_FIELDS)[number];

// Sort numerik-aware: "2" < "10" (bukan "10" < "2" seperti localeCompare).
function numericCompare(a: string, b: string): number {
  const pa = parseFloat(a);
  const pb = parseFloat(b);
  if (!Number.isNaN(pa) && !Number.isNaN(pb)) {
    if (pa !== pb) return pa - pb;
  }
  return a.localeCompare(b, undefined, { numeric: true });
}

/**
 * Nilai unik per kolom untuk dropdown filter ala Excel.
 * Scoped oleh role: produksi hanya melihat nilainya sendiri, QC hanya
 * dalam kabupaten tugas. Di-cache 5 menit di sisi client.
 *
 * `activeFilters` = filter lain yang sedang aktif; opsi tiap kolom
 * dibatasi oleh constraint tersebut (kecuali kolom itu sendiri, supaya
 * dropdown-nya tetap berisi semua nilai untuk bisa berganti pilihan).
 */
export async function getDistinctScheduleValues(
  ctx?: AuthContext,
  activeFilters?: DistinctFiltersInput,
): Promise<Record<DistinctFilterField, string[]>> {
  const admin = createAdminClient();
  const scope = ctx ? qcKabupatenScope(ctx) : null;
  const filters = activeFilters ?? {};

  const results = await Promise.all(
    DISTINCT_FILTER_FIELDS.map(async (field) => {
      let query = admin.from("schedules").select(field).not(field, "is", null);

      if (scope !== null) {
        query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
      } else if (ctx && ctx.role !== "admin") {
        query = query.eq("user_id", ctx.userId);
      }

      query = applyDistinctRelations(query, field, filters);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as Record<string, string | null>[];
      const values = rows.map((r) => r[field]).filter((v): v is string => !!v);
      return Array.from(new Set(values)).sort(numericCompare);
    }),
  );

  return {
    block_no: results[0] ?? [],
    no_plot: results[1] ?? [],
    nis: results[2] ?? [],
    document_no: results[3] ?? [],
    cgr: results[4] ?? [],
  };
}

type RelationsQuery = {
  ilike: (col: string, pattern: string) => unknown;
  like: (col: string, pattern: string) => unknown;
  eq: (col: string, value: string) => unknown;
  in: (col: string, values: string[]) => unknown;
};

/** Terapkan constraint dari filter lain (relasi cascading) — kolom sendiri dikecualikan. */
function applyDistinctRelations<Q>(
  query: Q,
  selfField: DistinctFilterField,
  filters: DistinctFiltersInput,
): Q {
  let q = query as unknown as RelationsQuery;
  const eqVal = (v?: string) => (v && v.trim() ? v.trim() : undefined);

  if (selfField !== "block_no" && filters.block_no && filters.block_no.length > 0) {
    q = q.in("block_no", filters.block_no.map((b) => b.trim())) as unknown as RelationsQuery;
  }
  if (selfField !== "no_plot" && eqVal(filters.no_plot)) {
    q = q.eq("no_plot", filters.no_plot!.trim()) as unknown as RelationsQuery;
  }
  if (selfField !== "nis" && eqVal(filters.nis)) {
    q = q.eq("nis", filters.nis!.trim()) as unknown as RelationsQuery;
  }
  if (selfField !== "document_no" && eqVal(filters.document_no)) {
    q = q.eq("document_no", filters.document_no!.trim()) as unknown as RelationsQuery;
  }
  if (selfField !== "cgr" && eqVal(filters.cgr)) {
    q = q.eq("cgr", filters.cgr!.trim()) as unknown as RelationsQuery;
  }
  if (eqVal(filters.kabupaten_id)) {
    q = q.eq("kabupaten_id", filters.kabupaten_id!.trim()) as unknown as RelationsQuery;
  }
  if (eqVal(filters.kecamatan_id)) {
    q = q.eq("kecamatan_id", filters.kecamatan_id!.trim()) as unknown as RelationsQuery;
  }
  if (eqVal(filters.desa_id)) {
    q = q.eq("desa_id", filters.desa_id!.trim()) as unknown as RelationsQuery;
  }
  if (filters.member_name && filters.member_name.trim()) {
    q = q.ilike("member_name", `%${escapeLike(filters.member_name.trim())}%`) as unknown as RelationsQuery;
  }
  if (filters.varietas && filters.varietas.trim()) {
    q = q.like("document_no", `%/${escapeLike(filters.varietas.trim())}/%`) as unknown as RelationsQuery;
  }
  return q as unknown as Q;
}
