import type { Schedule, ActivityLog } from "@/types";

export interface DashboardStats {
  todayCount: number;
  tomorrowCount: number;
  weekCount: number;
  lateCount: number;
  completedCount: number;
  pendingCount: number;
  totalThisMonth: number;
}

export interface DashboardData {
  stats: DashboardStats;
  todaySchedules: Schedule[];
  upcomingSchedules: Schedule[];
  recentActivities: ActivityLog[];
}
