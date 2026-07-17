import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import type { DashboardData, DashboardStats } from "../types";
import type { Schedule, ActivityLog } from "@/types";

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const admin = createAdminClient();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = addDays(now, 1).toISOString().split("T")[0];
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split("T")[0];
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString().split("T")[0];
  const monthStart = startOfMonth(now).toISOString().split("T")[0];
  const monthEnd = endOfMonth(now).toISOString().split("T")[0];

  const baseQuery = admin.from("schedules").select("*", { count: "exact", head: true });

  const todayQuery = baseQuery.eq("user_id", userId).eq("visit_date", today);
  const tomorrowQuery = baseQuery.eq("user_id", userId).eq("visit_date", tomorrow);
  const weekQuery = baseQuery.eq("user_id", userId).gte("visit_date", weekStart).lte("visit_date", weekEnd);
  const lateQuery = baseQuery.eq("user_id", userId).lt("visit_date", today).not("status", "in", '("completed","cancelled")');
  const completedQuery = baseQuery.eq("user_id", userId).eq("status", "completed").gte("visit_date", monthStart).lte("visit_date", monthEnd);
  const pendingQuery = baseQuery.eq("user_id", userId).eq("status", "pending").gte("visit_date", today).lte("visit_date", monthEnd);
  const monthQuery = baseQuery.eq("user_id", userId).gte("visit_date", monthStart).lte("visit_date", monthEnd);

  const [
    { count: todayCount },
    { count: tomorrowCount },
    { count: weekCount },
    { count: lateCount },
    { count: completedCount },
    { count: pendingCount },
    { count: totalThisMonth },
  ] = await Promise.all([
    todayQuery,
    tomorrowQuery,
    weekQuery,
    lateQuery,
    completedQuery,
    pendingQuery,
    monthQuery,
  ]);

  const stats: DashboardStats = {
    todayCount: todayCount ?? 0,
    tomorrowCount: tomorrowCount ?? 0,
    weekCount: weekCount ?? 0,
    lateCount: lateCount ?? 0,
    completedCount: completedCount ?? 0,
    pendingCount: pendingCount ?? 0,
    totalThisMonth: totalThisMonth ?? 0,
  };

  const [todaySchedulesRes, upcomingSchedulesRes, recentActivityRes] = await Promise.all([
    admin
      .from("schedules")
      .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name)")
      .eq("user_id", userId)
      .eq("visit_date", today)
      .order("created_at"),
    admin
      .from("schedules")
      .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name)")
      .eq("user_id", userId)
      .gt("visit_date", today)
      .order("visit_date", { ascending: true })
      .limit(5),
    admin
      .from("activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    stats,
    todaySchedules: (todaySchedulesRes.data ?? []) as unknown as Schedule[],
    upcomingSchedules: (upcomingSchedulesRes.data ?? []) as unknown as Schedule[],
    recentActivities: (recentActivityRes.data ?? []) as unknown as ActivityLog[],
  };
}
