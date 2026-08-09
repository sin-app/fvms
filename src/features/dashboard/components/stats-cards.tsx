"use client";

import { CalendarCheck, CalendarClock, CalendarX, CheckCircle2, ListTodo, AlertTriangle, Sprout, Timer, EyeOff, AlertOctagon } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import type { DashboardStats } from "../types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Hari Ini"
          value={stats.todayCount}
          icon={<CalendarCheck className="h-5 w-5 text-blue-500" />}
          href="/schedules"
        />
      </div>
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Besok"
          value={stats.tomorrowCount}
          icon={<CalendarClock className="h-5 w-5 text-purple-500" />}
          href="/schedules"
        />
      </div>
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Minggu Ini"
          value={stats.weekCount}
          icon={<ListTodo className="h-5 w-5 text-amber-500" />}
          href="/schedules"
        />
      </div>
      {stats.lateCount > 0 && (
        <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
          <StatCard
            title="Terlambat"
            value={stats.lateCount}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            href="/schedules"
          />
        </div>
      )}
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Selesai (Bulan Ini)"
          value={stats.completedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
        />
      </div>
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Pending"
          value={stats.pendingCount}
          icon={<CalendarX className="h-5 w-5 text-muted-foreground" />}
        />
      </div>
      {stats.gagalPartialCount > 0 && (
        <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
          <StatCard
            title="Gagal Partial (Bulan Ini)"
            value={stats.gagalPartialCount}
            icon={<AlertOctagon className="h-5 w-5 text-orange-500" />}
          />
        </div>
      )}
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Sudah Panen"
          value={stats.sudahPanenCount}
          icon={<Sprout className="h-5 w-5 text-green-600" />}
          href="/schedules"
        />
      </div>
      {stats.jatuhTempoCount > 0 && (
        <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
          <StatCard
            title="Jatuh Tempo Panen"
            value={stats.jatuhTempoCount}
            icon={<Timer className="h-5 w-5 text-orange-500" />}
            href="/schedules"
          />
        </div>
      )}
      <div className="w-44 shrink-0 snap-start sm:w-56 md:w-auto md:contents">
        <StatCard
          title="Belum Panen"
          value={stats.belumPanenCount}
          icon={<EyeOff className="h-5 w-5 text-muted-foreground" />}
        />
      </div>
    </div>
  );
}
