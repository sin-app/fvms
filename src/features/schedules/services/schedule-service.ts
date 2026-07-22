import { createAdminClient } from "@/lib/supabase/admin-client";
import { qcKabupatenScope } from "@/lib/auth/authorization";
import type { AuthContext } from "@/lib/auth/authorization";
import type { Schedule } from "@/types";
import type { ScheduleFilters, ScheduleListResult } from "../types";

// Escape LIKE wildcards so user input can't alter the match pattern.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export async function getScheduleList(
  userId: string,
  filters: ScheduleFilters = {},
  ctx?: AuthContext,
): Promise<ScheduleListResult> {
  const admin = createAdminClient();
  const {
    status,
    kabupaten_id,
    kecamatan_id,
    date_from,
    date_to,
    page = 1,
    pageSize = 20,
    user_id,
    cgr,
  } = filters;

  const scope = ctx ? qcKabupatenScope(ctx) : null;

  let query = admin
    .from("schedules")
    .select(
      "*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)",
      { count: "exact" },
    );

  if (scope !== null) {
    // QC: restrict to assigned kabupaten. Empty assignment => no rows.
    query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
  }

  if (userId !== "all" && !user_id) {
    query = query.eq("user_id", userId);
  }

  if (user_id) {
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

  if (filters.tgl_tanam && filters.tgl_tanam.trim()) {
    query = query.ilike("tgl_tanam", `%${escapeLike(filters.tgl_tanam.trim())}%`);
  }

  if (status && status !== "all") {
    if (status === "late") {
      query = query
        .lt("visit_date", new Date().toISOString().split("T")[0])
        .not("status", "in", '("completed","cancelled")');
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

  if (date_from && date_to) {
    query = query.gte("visit_date", date_from).lte("visit_date", date_to);
  } else if (date_from) {
    query = query.gte("visit_date", date_from);
  } else   if (date_to) {
    query = query.lte("visit_date", date_to);
  }

  query = query.is("deleted_at", null).order("visit_date", { ascending: true });

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

export async function getScheduleById(id: string): Promise<Schedule | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("schedules")
    .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email), visit_notes(*), visit_photos(*)")
    .eq("id", id)
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
  sisa_di_lahan_ha?: number;
  tgl_tanam?: string;
}) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("schedules")
    .insert({ ...data, created_by: data.user_id, status: "pending" })
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
    sisa_di_lahan_ha?: number;
    tgl_tanam?: string;
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

export async function getDistinctCgr(userId: string, ctx?: AuthContext): Promise<string[]> {
  const admin = createAdminClient();
  const scope = ctx ? qcKabupatenScope(ctx) : null;
  let query = admin
    .from("schedules")
    .select("cgr")
    .not("cgr", "is", null)
    .is("deleted_at", null);

  if (scope !== null) {
    query = query.in("kabupaten_id", scope.length > 0 ? scope : ["__none__"]);
  }

  if (userId !== "all") {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const values = (data ?? [])
    .map((r) => (r as { cgr: string | null }).cgr)
    .filter((v): v is string => !!v);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
