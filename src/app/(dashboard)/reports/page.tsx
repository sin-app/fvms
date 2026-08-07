"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ReportFiltersView, ReportCharts, ReportTable } from "@/features/reports";
import { useReportBundle } from "@/features/reports/hooks/use-report-bundle";
import { useDebounce } from "@/hooks/use-debounce";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import { CalendarCheck, Clock, AlertTriangle, CheckCircle, Sprout, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-context";
import { todayString, firstOfMonthString } from "@/lib/utils/date";
import type { ReportFilters } from "@/features/reports";

export default function ReportsPage() {
  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "qc";
  const scopeKabupatenIds =
    user?.role === "qc" ? (user.assigned_kabupaten_ids ?? []) : undefined;

  const today = todayString();
  const firstOfMonth = firstOfMonthString();

  const [memberName, setMemberName] = useState("");
  const [blockNo, setBlockNo] = useState("");
  const [noPlot, setNoPlot] = useState("");
  const [nis, setNis] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [status, setStatus] = useState("all");
  const [userId, setUserId] = useState("");
  const [cgr, setCgr] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [varietas, setVarietas] = useState("");
  const [panenStatus, setPanenStatus] = useState("all");
  const [label, setLabel] = useState("all");

  const debouncedMemberName = useDebounce(memberName, 300);
  const debouncedBlockNo = useDebounce(blockNo, 300);
  const debouncedNoPlot = useDebounce(noPlot, 300);
  const debouncedNis = useDebounce(nis, 300);
  const debouncedDocumentNo = useDebounce(documentNo, 300);
  const debouncedCgr = useDebounce(cgr, 300);
  const debouncedVarietas = useDebounce(varietas, 300);

  const filters: ReportFilters = useMemo(() => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    user_id: userId || undefined,
    kabupaten_id: kabupatenId || undefined,
    kecamatan_id: kecamatanId || undefined,
    label: label !== "all" ? label : undefined,
    member_name: debouncedMemberName || undefined,
    block_no: debouncedBlockNo || undefined,
    no_plot: debouncedNoPlot || undefined,
    nis: debouncedNis || undefined,
    document_no: debouncedDocumentNo || undefined,
    cgr: debouncedCgr || undefined,
    varietas: debouncedVarietas || undefined,
    status: status !== "all" ? status : undefined,
    panen_status: panenStatus !== "all" ? panenStatus : undefined,
  }), [dateFrom, dateTo, userId, kabupatenId, kecamatanId, label, debouncedMemberName, debouncedBlockNo, debouncedNoPlot, debouncedNis, debouncedDocumentNo, debouncedCgr, debouncedVarietas, status, panenStatus]);

  const { data: bundle, isLoading, isFetching, isError, refetch } = useReportBundle(filters);
  const data = bundle?.data;
  const rows = bundle?.rows;

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
        memberName={memberName}
        onMemberNameChange={setMemberName}
        blockNo={blockNo}
        onBlockNoChange={setBlockNo}
        noPlot={noPlot}
        onNoPlotChange={setNoPlot}
        nis={nis}
        onNisChange={setNis}
        documentNo={documentNo}
        onDocumentNoChange={setDocumentNo}
        status={status}
        onStatusChange={setStatus}
        userId={userId}
        onUserIdChange={setUserId}
        cgr={cgr}
        onCgrChange={setCgr}
        kabupatenId={kabupatenId}
        onKabupatenChange={setKabupatenId}
        kecamatanId={kecamatanId}
        onKecamatanChange={setKecamatanId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        varietas={varietas}
        onVarietasChange={setVarietas}
        panenStatus={panenStatus}
        onPanenStatusChange={setPanenStatus}
        label={label}
        onLabelChange={setLabel}
        hidePetugasFilter={!isPrivileged}
        scopeKabupatenIds={scopeKabupatenIds}
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
                value={rows.filter((r) => r.panen_status === "Panen").length}
                icon={<Sprout className="h-4 w-4 text-green-600" />}
              />
              <StatCard
                title="Rencana Panen"
                value={rows.filter((r) => r.panen_status?.startsWith("Renc:")).length}
                icon={<CalendarCheck className="h-4 w-4 text-amber-500" />}
              />
              <StatCard
                title="Belum Panen"
                value={rows.filter((r) => r.panen_status === "—").length}
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
          {isLoading && !rows && <LoadingState variant="table" />}
        </>
      )}
    </div>
  );
}
