import { createAdminClient } from "@/lib/supabase/admin-client";
import type { Schedule } from "@/types";
import type { ScheduleFilters, ScheduleListResult } from "../types";

export async function getScheduleList(
  userId: string,
  filters: ScheduleFilters = {},
): Promise<ScheduleListResult> {
  const admin = createAdminClient();
  const {
    search,
    status,
    kabupaten_id,
    kecamatan_id,
    date_from,
    date_to,
    page = 1,
    pageSize = 20,
    user_id,
  } = filters;

  let query = admin
    .from("schedules")
    .select(
      "*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), user!inner(name, email)",
      { count: "exact" },
    );

  if (userId !== "all" && !user_id) {
    query = query.eq("user_id", userId);
  }

  if (user_id) {
    query = query.eq("user_id", user_id);
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

  if (date_from && date_to) {
    query = query.gte("visit_date", date_from).lte("visit_date", date_to);
  } else if (date_from) {
    query = query.gte("visit_date", date_from);
  } else if (date_to) {
    query = query.lte("visit_date", date_to);
  }

  if (search) {
    query = query.or(
      `kabupaten.name.ilike.%${search}%,kecamatan.name.ilike.%${search}%,desa.name.ilike.%${search}%`,
    );
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
    .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), user!inner(name, email), visit_notes(*), visit_photos(*)")
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
) {
  const admin = createAdminClient();
  let query = admin
    .from("schedules")
    .select("id, visit_date, status, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name)")
    .gte("visit_date", start)
    .lte("visit_date", end)
    .is("deleted_at", null);

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
