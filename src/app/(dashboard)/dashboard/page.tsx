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
import { useAuth } from "@/features/auth/components/auth-context";

function DashboardHero() {
  const { user } = useAuth();
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "Petugas";

  return (
    <div className="bg-brand-gradient animate-fade-in-up rounded-2xl px-5 py-5 text-white shadow-brand-glow sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-white/70">
        {dateLabel}
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
        Halo, {firstName}
      </h1>
      <p className="mt-0.5 text-sm text-white/80">
        Ringkasan jadwal kunjungan Anda
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const { data, isLoading, isError, refetch } = useDashboard(
    kabupatenId || kecamatanId ? { kabupaten_id: kabupatenId || undefined, kecamatan_id: kecamatanId || undefined } : undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHero />
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
      <DashboardHero />

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
