import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import { qcKabupatenScope } from "@/lib/auth/authorization";
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
  const today = now.toISOString().split("T")[0];
  const tomorrow = addDays(now, 1).toISOString().split("T")[0];
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split("T")[0];
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString().split("T")[0];
  const monthStart = startOfMonth(now).toISOString().split("T")[0];
  const monthEnd = endOfMonth(now).toISOString().split("T")[0];

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

  const applyFilters = <Q extends { eq: (column: string, value: unknown) => Q; in: (column: string, values: string[]) => Q }>(
    q: Q,
  ): Q => {
    let r = scoped(q);
    if (filters?.kecamatan_id && kabScope === null) {
      r = r.eq("kecamatan_id", filters.kecamatan_id);
    }
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
    .not("status", "in", "(completed,cancelled)");
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

  const counts = await Promise.all([
    todayQuery,
    tomorrowQuery,
    weekQuery,
    lateQuery,
    completedQuery,
    pendingQuery,
    monthQuery,
  ]);

  const stats: DashboardStats = {
    todayCount: counts[0].count ?? 0,
    tomorrowCount: counts[1].count ?? 0,
    weekCount: counts[2].count ?? 0,
    lateCount: counts[3].count ?? 0,
    completedCount: counts[4].count ?? 0,
    pendingCount: counts[5].count ?? 0,
    totalThisMonth: counts[6].count ?? 0,
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
    todaySchedules: (todaySchedulesRes.data ?? []) as unknown as Schedule[],
    upcomingSchedules: (upcomingSchedulesRes.data ?? []) as unknown as Schedule[],
    recentActivities: (recentActivityRes.data ?? []) as unknown as ActivityLog[],
  };
}
