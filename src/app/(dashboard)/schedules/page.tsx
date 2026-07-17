"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ScheduleTable, ScheduleForm, ScheduleFilters } from "@/features/schedules";
import { createScheduleAction } from "@/features/schedules/actions/schedule-actions";
import { useDebounce } from "@/hooks/use-debounce";

export default function SchedulesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [kabupatenId, setKabupatenId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
    kabupaten_id: kabupatenId || undefined,
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
