import { createAdminClient } from "@/lib/supabase/admin-client";
import { qcKabupatenScope } from "@/lib/auth/authorization";
import { todayString } from "@/lib/utils/date";
import { getPanenStatus } from "@/features/panen/services/panen-logic";
import type { AuthContext } from "@/lib/auth/authorization";
import type { Schedule } from "@/types";
import type { ScheduleFilters, ScheduleListResult } from "../types";

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
    query = query.ilike("cgr", `%${escapeLike(cgr)}%`);
  }

  if (filters.member_name && filters.member_name.trim()) {
    query = query.ilike("member_name", `%${escapeLike(filters.member_name.trim())}%`);
  }

  if (filters.block_no && filters.block_no.trim()) {
    query = query.ilike("block_no", `%${escapeLike(filters.block_no.trim())}%`);
  }

  if (filters.no_plot && filters.no_plot.trim()) {
    query = query.ilike("no_plot", `%${escapeLike(filters.no_plot.trim())}%`);
  }

  if (filters.nis && filters.nis.trim()) {
    query = query.ilike("nis", `%${escapeLike(filters.nis.trim())}%`);
  }

  if (filters.document_no && filters.document_no.trim()) {
    query = query.ilike("document_no", `%${escapeLike(filters.document_no.trim())}%`);
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

  const { query: baseQuery } = buildScheduleQuery(userId, filters, ctx);

  let query = baseQuery;
  query = query.is("deleted_at", null).order("visit_date", { ascending: true });

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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

  const { query } = buildScheduleQuery(userId, filters, ctx);

  let exportQuery = query.is("deleted_at", null).order("visit_date", { ascending: true });
  if (panenStatus) exportQuery = exportQuery.limit(MAX_EXPORT_ROWS);

  const { data, error } = await exportQuery;

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

export async function getDistinctCgr(ctx?: AuthContext): Promise<string[]> {
  const admin = createAdminClient();
  const scope = ctx ? qcKabupatenScope(ctx) : null;

  let query = admin
    .from("schedules")
    .select("cgr")
    .not("cgr", "is", null);

  if (scope !== null) {
    query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
  } else if (ctx && ctx.role !== "admin") {
    query = query.eq("user_id", ctx.userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const values = (data ?? [])
    .map((r) => (r as { cgr: string | null }).cgr)
    .filter((v): v is string => !!v);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
