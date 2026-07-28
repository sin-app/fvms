"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ReportFiltersView, ReportCharts, ReportTable, useReportData } from "@/features/reports";
import { useReportRows } from "@/features/reports/hooks/use-report-rows";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import { CalendarCheck, Clock, AlertTriangle, CheckCircle, Sprout, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-context";
import { todayString } from "@/lib/utils/date";
import type { ReportFilters } from "@/features/reports";

export default function ReportsPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "qc";
  const scopeKabupatenIds =
    user?.role === "qc" ? (user.assigned_kabupaten_ids ?? []) : undefined;

  const today = todayString();
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [userId, setUserId] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [label, setLabel] = useState("");

  const filters: ReportFilters = useMemo(() => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    user_id: userId || undefined,
    kabupaten_id: kabupatenId || undefined,
    kecamatan_id: kecamatanId || undefined,
    label: label || undefined,
  }), [dateFrom, dateTo, userId, kabupatenId, kecamatanId, label]);

  const { data, isLoading, isFetching, isError, refetch } = useReportData(filters);
  const { data: rows, isLoading: rowsLoading, isFetching: rowsFetching } = useReportRows(filters);

  function handleReset() {
    setDateFrom(firstOfMonth);
    setDateTo(today);
    setUserId("");
    setKabupatenId("");
    setKecamatanId("");
    setLabel("");
  }

  const handleDownload = async () => {
    const { default: fileSaver } = await import("file-saver");
    const { downloadExcelAction } = await import("@/features/reports/api/report-client");
    const result = await downloadExcelAction(filters);
    const byteArray = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    fileSaver.saveAs(blob, result.filename);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        description="Lihat dan export laporan kunjungan lapangan"
      />

      <ReportFiltersView
        dateFrom={dateFrom}
        dateTo={dateTo}
        userId={userId}
        kabupatenId={kabupatenId}
        kecamatanId={kecamatanId}
        label={label}
        showUserFilter={isPrivileged}
        scopeKabupatenIds={scopeKabupatenIds}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onUserChange={setUserId}
        onKabupatenChange={setKabupatenId}
        onKecamatanChange={setKecamatanId}
        onLabelChange={setLabel}
        onReset={handleReset}
      />

      {isLoading && <LoadingState variant="card" count={4} />}
      {isError && !data && <ErrorState onRetry={refetch} />}

          {data && (
        <>
          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat ulang...
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Jadwal"
              value={data.total_schedules}
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <StatCard
              title="Selesai"
              value={data.completed}
              icon={<CheckCircle className="h-4 w-4" />}
              trend={{ value: data.completion_rate, positive: data.completion_rate > 50 }}
            />
            <StatCard
              title="Dalam Proses"
              value={data.in_progress}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              title="Terlambat"
              value={data.late_count}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={{ value: data.late_count, positive: data.late_count === 0 }}
            />
          </div>
          {rows && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Sudah Panen"
                value={rows.filter((r) => r.real_panen).length}
                icon={<Sprout className="h-4 w-4 text-green-600" />}
              />
              <StatCard
                title="Rencana Panen"
                value={rows.filter((r) => r.rencana_panen).length}
                icon={<CalendarCheck className="h-4 w-4 text-amber-500" />}
              />
              <StatCard
                title="Belum Panen"
                value={rows.filter((r) => !r.real_panen).length}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          )}

          <ReportCharts data={data} />

          {rows && (
            <ReportTable
              rows={rows}
              onDownload={handleDownload}
            />
          )}
          {rowsLoading && !rows && <LoadingState variant="table" />}
        </>
      )}
    </div>
  );
}
