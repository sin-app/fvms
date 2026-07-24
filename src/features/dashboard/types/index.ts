import type { Schedule, ActivityLog } from "@/types";

export interface DashboardStats {
  todayCount: number;
  tomorrowCount: number;
  weekCount: number;
  lateCount: number;
  completedCount: number;
  pendingCount: number;
  totalThisMonth: number;
  sudahPanenCount: number;
  jatuhTempoCount: number;
  belumPanenCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  todaySchedules: Schedule[];
  upcomingSchedules: Schedule[];
  recentActivities: ActivityLog[];
}

export interface DashboardFilters {
  kabupaten_id?: string;
  kecamatan_id?: string;
}
