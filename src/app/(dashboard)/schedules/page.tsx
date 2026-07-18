"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Calendar, FileDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ScheduleTable, ScheduleForm, ScheduleFilters } from "@/features/schedules";
import { createScheduleAction } from "@/features/schedules/actions/schedule-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { exportPdf } from "@/lib/export/pdf";
import type { Schedule } from "@/types";

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kabupatenId, setKabupatenId] = useState("");
  const [kecamatanId, setKecamatanId] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  function handleDownloadPdf() {
    const qfilters = {
      search: debouncedSearch || undefined,
      status: status !== "all" ? status : undefined,
      kabupaten_id: kabupatenId || undefined,
      kecamatan_id: kecamatanId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
    };
    const cached = queryClient.getQueryData<{ data: Schedule[] }>(["schedules", qfilters]);
    const rows = (cached?.data ?? []).map((s) => ({
      date: s.visit_date,
      kabupaten: (s as unknown as { kabupaten?: { name: string } }).kabupaten?.name ?? "—",
      kecamatan: (s as unknown as { kecamatan?: { name: string } }).kecamatan?.name ?? "—",
      desa: (s as unknown as { desa?: { name: string } }).desa?.name ?? "—",
      status: s.status,
    }));
    if (!rows.length) return;
    exportPdf(
      "Daftar Jadwal Kunjungan",
      [
        { header: "Tanggal", dataKey: "date" },
        { header: "Kabupaten", dataKey: "kabupaten" },
        { header: "Kecamatan", dataKey: "kecamatan" },
        { header: "Desa", dataKey: "desa" },
        { header: "Status", dataKey: "status" },
      ],
      rows,
      `jadwal-${new Date().toISOString().split("T")[0]}.pdf`,
    );
  }

  const filters = {
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
    kabupaten_id: kabupatenId || undefined,
    kecamatan_id: kecamatanId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Kunjungan"
        description="Kelola jadwal kunjungan lapangan"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Link href="/schedules/calendar">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                Kalender
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Buat Jadwal
            </Button>
          </div>
        }
      />

      <ScheduleFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
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
      />

      <ScheduleTable filters={filters} />

      <ScheduleForm
        action={createScheduleAction}
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
