import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import { qcKabupatenScope } from "@/lib/auth/authorization";
import { dateString } from "@/lib/utils/date";
import type { AuthContext } from "@/lib/auth/authorization";
import type { DashboardData, DashboardStats, DashboardFilters } from "../types";
import type { Schedule, ActivityLog } from "@/types";

export async function getDashboardData(
  userId: string,
  ctx?: AuthContext,
  filters?: DashboardFilters,
): Promise<DashboardData> {
  const admin = createAdminClient();
  const now = new Date();
  const today = dateString(now);
  const tomorrow = dateString(addDays(now, 1));
  const weekStart = dateString(startOfWeek(now, { weekStartsOn: 1 }));
  const weekEnd = dateString(endOfWeek(now, { weekStartsOn: 1 }));
  const monthStart = dateString(startOfMonth(now));
  const monthEnd = dateString(endOfMonth(now));

  const kabScope = ctx ? qcKabupatenScope(ctx) : null;
  const scoped = <Q extends { eq: (column: string, value: unknown) => Q; in: (column: string, values: string[]) => Q }>(
    q: Q,
  ): Q => {
    let r = q;
    if (kabScope !== null) {
      r = r.in("kabupaten_id", kabScope.length > 0 ? kabScope : ["__none__"]);
    } else if (filters?.kabupaten_id) {
      r = r.eq("kabupaten_id", filters.kabupaten_id);
    } else if (userId !== "all") {
      r = r.eq("user_id", userId);
    }
    return r;
  };

  const applyFilters = <Q extends { eq: (column: string, value: unknown) => Q; in: (column: string, values: string[]) => Q; is: (column: string, value: null) => Q }>(
    q: Q,
  ): Q => {
    let r = scoped(q);
    if (filters?.kecamatan_id && kabScope === null) {
      r = r.eq("kecamatan_id", filters.kecamatan_id);
    }
    r = r.is("deleted_at", null);
    return r;
  };

  const baseQuery = () =>
    admin.from("schedules").select("*", { count: "exact", head: true });

  const todayQuery = applyFilters(baseQuery()).eq("visit_date", today);
  const tomorrowQuery = applyFilters(baseQuery()).eq("visit_date", tomorrow);
  const weekQuery = applyFilters(baseQuery())
    .gte("visit_date", weekStart)
    .lte("visit_date", weekEnd);
  const lateQuery = applyFilters(baseQuery())
    .lt("visit_date", today)
    .not("status", "in", "(completed,gagal_partial,gagal_total)");
  const completedQuery = applyFilters(baseQuery())
    .eq("status", "completed")
    .gte("visit_date", monthStart)
    .lte("visit_date", monthEnd);
  const pendingQuery = applyFilters(baseQuery())
    .eq("status", "pending")
    .gte("visit_date", today)
    .lte("visit_date", monthEnd);
  const monthQuery = applyFilters(baseQuery())
    .gte("visit_date", monthStart)
    .lte("visit_date", monthEnd);
  const sudahPanenQuery = applyFilters(baseQuery())
    .or("real_panen.not.is.NULL,tgl_panen.not.is.NULL");
  const jatuhTempoQuery = applyFilters(baseQuery())
    .is("real_panen", null)
    .is("tgl_panen", null)
    .lt("rencana_panen", today)
    .not("status", "in", "(completed,gagal_partial,gagal_total)");
  const belumPanenQuery = applyFilters(baseQuery())
    .is("real_panen", null)
    .is("tgl_panen", null)
    .or(`rencana_panen.gte.${today},rencana_panen.is.null`);

  const counts = await Promise.all([
    todayQuery,
    tomorrowQuery,
    weekQuery,
    lateQuery,
    completedQuery,
    pendingQuery,
    monthQuery,
    sudahPanenQuery,
    jatuhTempoQuery,
    belumPanenQuery,
  ]);

  const stats: DashboardStats = {
    todayCount: counts[0].count ?? 0,
    tomorrowCount: counts[1].count ?? 0,
    weekCount: counts[2].count ?? 0,
    lateCount: counts[3].count ?? 0,
    completedCount: counts[4].count ?? 0,
    pendingCount: counts[5].count ?? 0,
    totalThisMonth: counts[6].count ?? 0,
    sudahPanenCount: counts[7].count ?? 0,
    jatuhTempoCount: counts[8].count ?? 0,
    belumPanenCount: counts[9].count ?? 0,
  };

  const [todaySchedulesRes, upcomingSchedulesRes, recentActivityRes] = await Promise.all([
    applyFilters(
      admin
        .from("schedules")
        .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name)")
        .eq("visit_date", today),
    ).order("created_at"),
    applyFilters(
      admin
        .from("schedules")
        .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name)")
        .gt("visit_date", today),
    )
      .order("visit_date", { ascending: true })
      .limit(5),
    kabScope === null && userId === "all"
      ? admin
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10)
      : kabScope === null
        ? admin
            .from("activity_logs")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)
        : admin.from("activity_logs").select("*").eq("id", "__none__"),
  ]);

  return {
    stats,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    todaySchedules: (todaySchedulesRes.data ?? []) as unknown as Schedule[],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    upcomingSchedules: (upcomingSchedulesRes.data ?? []) as unknown as Schedule[],
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    recentActivities: (recentActivityRes.data ?? []) as unknown as ActivityLog[],
  };
}
