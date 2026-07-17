"use client";

import { CalendarCheck, CalendarClock, CalendarX, CheckCircle2, ListTodo, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { DashboardStats } from "../types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <StatCard
        title="Hari Ini"
        value={stats.todayCount}
        icon={<CalendarCheck className="h-5 w-5 text-blue-500" />}
        href="/schedules"
      />
      <StatCard
        title="Besok"
        value={stats.tomorrowCount}
        icon={<CalendarClock className="h-5 w-5 text-purple-500" />}
        href="/schedules"
      />
      <StatCard
        title="Minggu Ini"
        value={stats.weekCount}
        icon={<ListTodo className="h-5 w-5 text-amber-500" />}
        href="/schedules"
      />
      {stats.lateCount > 0 && (
        <StatCard
          title="Terlambat"
          value={stats.lateCount}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          href="/schedules"
        />
      )}
      <StatCard
        title="Selesai (Bulan Ini)"
        value={stats.completedCount}
        icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
      />
      <StatCard
        title="Pending"
        value={stats.pendingCount}
        icon={<CalendarX className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
