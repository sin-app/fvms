import { getOfflineDb } from "@/lib/offline/db";
import { offlineRowToSchedule } from "@/features/schedules/services/offline-read";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import { dateString } from "@/lib/utils/date";
import type { DashboardData, DashboardStats, DashboardFilters } from "../types";
import type { ActivityLog } from "@/types";

/**
 * Dashboard lokal-first: semua angka dihitung dari IndexedDB.
 * Data IDB sudah scoped peran saat hydrate (produksi = miliknya, qc = kabupaten
 * tugas, admin = semua), jadi filter kabupaten hanya relevan untuk admin.
 */
export async function loadOfflineDashboard(
  role: "admin" | "qc" | "produksi",
  filters?: DashboardFilters,
): Promise<DashboardData> {
  const db = getOfflineDb();
  const now = new Date();
  const today = dateString(now);
  const tomorrow = dateString(addDays(now, 1));
  const weekStart = dateString(startOfWeek(now, { weekStartsOn: 1 }));
  const weekEnd = dateString(endOfWeek(now, { weekStartsOn: 1 }));
  const monthStart = dateString(startOfMonth(now));
  const monthEnd = dateString(endOfMonth(now));

  const [rows, logs] = await Promise.all([
    db.schedules.toArray(),
    db.activityLogs.orderBy("created_at").reverse().limit(10).toArray(),
  ]);

  const scoped = (s: (typeof rows)[number]) => {
    if (role === "admin" && filters?.kabupaten_id && s.kabupaten_id !== filters.kabupaten_id) {
      return false;
    }
    if (role === "admin" && filters?.kecamatan_id && s.kecamatan_id !== filters.kecamatan_id) {
      return false;
    }
    return true;
  };

  const inScope = rows.filter(scoped);

  const count = (predicate: (s: (typeof rows)[number]) => boolean) =>
    inScope.filter(predicate).length;

  const stats: DashboardStats = {
    todayCount: count((s) => s.visit_date === today),
    tomorrowCount: count((s) => s.visit_date === tomorrow),
    weekCount: count((s) => s.visit_date >= weekStart && s.visit_date <= weekEnd),
    lateCount: count(
      (s) =>
        s.visit_date < today &&
        s.status !== "completed" &&
        s.status !== "gagal_partial" &&
        s.status !== "gagal_total",
    ),
    completedCount: count(
      (s) => s.status === "completed" && s.visit_date >= monthStart && s.visit_date <= monthEnd,
    ),
    pendingCount: count(
      (s) => s.status === "pending" && s.visit_date >= today && s.visit_date <= monthEnd,
    ),
    gagalPartialCount: count(
      (s) => s.status === "gagal_partial" && s.visit_date >= monthStart && s.visit_date <= monthEnd,
    ),
    totalThisMonth: count((s) => s.visit_date >= monthStart && s.visit_date <= monthEnd),
    sudahPanenCount: count((s) => s.real_panen != null || s.tgl_panen != null),
    jatuhTempoCount: count(
      (s) =>
        s.real_panen == null &&
        s.tgl_panen == null &&
        (s.rencana_panen ?? "") < today &&
        s.status !== "completed" &&
        s.status !== "gagal_partial" &&
        s.status !== "gagal_total",
    ),
    belumPanenCount: count(
      (s) =>
        s.real_panen == null &&
        s.tgl_panen == null &&
        ((s.rencana_panen ?? "") >= today || s.rencana_panen == null),
    ),
  };

  const todaySchedules = inScope
    .filter((s) => s.visit_date === today)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 8)
    .map(offlineRowToSchedule);

  const upcomingSchedules = inScope
    .filter((s) => s.visit_date > today)
    .sort((a, b) => a.visit_date.localeCompare(b.visit_date))
    .slice(0, 5)
    .map(offlineRowToSchedule);

  const recentActivities = logs as unknown as ActivityLog[];

  return { stats, todaySchedules, upcomingSchedules, recentActivities };
}
