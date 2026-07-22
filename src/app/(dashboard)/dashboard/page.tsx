"use client";

import { useState } from "react";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { StatsCards } from "@/features/dashboard/components/stats-cards";
import { TodaySchedule } from "@/features/dashboard/components/today-schedule";
import { UpcomingSchedule } from "@/features/dashboard/components/upcoming-schedule";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const { data, isLoading, isFetching, isError, refetch } = useDashboard(
    kabupatenId || kecamatanId ? { kabupaten_id: kabupatenId || undefined, kecamatan_id: kecamatanId || undefined } : undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan jadwal kunjungan Anda
          </p>
        </div>
        <LoadingState variant="card" count={4} />
        <div className="grid gap-6 lg:grid-cols-2">
          <LoadingState variant="list" count={3} />
          <LoadingState variant="list" count={3} />
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan jadwal kunjungan Anda
          </p>
        </div>
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat ulang...
          </div>
        )}
      </div>

      <DashboardFilters
        kabupatenId={kabupatenId}
        kecamatanId={kecamatanId}
        onKabupatenChange={setKabupatenId}
        onKecamatanChange={setKecamatanId}
      />

      {data && <StatsCards stats={data.stats} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {data && <TodaySchedule schedules={data.todaySchedules} />}
        {data && <UpcomingSchedule schedules={data.upcomingSchedules} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data && <RecentActivity activities={data.recentActivities} />}
        <QuickActions />
      </div>
    </div>
  );
}
