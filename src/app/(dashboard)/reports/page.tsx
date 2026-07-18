"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ReportFiltersView, ReportCharts, ReportTable, useReportData } from "@/features/reports";
import { useReportRows } from "@/features/reports/hooks/use-report-rows";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import { CalendarCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { ReportFilters } from "@/features/reports";

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [userId, setUserId] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");

  const filters: ReportFilters = useMemo(() => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    user_id: userId || undefined,
    kabupaten_id: kabupatenId || undefined,
  }), [dateFrom, dateTo, userId, kabupatenId]);

  const { data, isLoading, isError, refetch } = useReportData(filters);
  const { data: rows, isLoading: rowsLoading } = useReportRows(filters);

  function handleReset() {
    setDateFrom(firstOfMonth);
    setDateTo(today);
    setUserId("");
    setKabupatenId("");
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
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onUserChange={setUserId}
        onKabupatenChange={setKabupatenId}
        onReset={handleReset}
      />

      {isLoading && <LoadingState variant="card" count={4} />}
      {isError && <ErrorState onRetry={refetch} />}

      {data && (
        <>
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
              value={data.on_the_way + data.in_progress}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              title="Terlambat"
              value={data.late_count}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={{ value: data.late_count, positive: data.late_count === 0 }}
            />
          </div>

          <ReportCharts data={data} />

          {rows && (
            <ReportTable
              rows={rows}
              onDownload={handleDownload}
            />
          )}
          {rowsLoading && <LoadingState variant="table" />}
        </>
      )}
    </div>
  );
}
