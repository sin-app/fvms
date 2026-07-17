"use client";

import { SearchInput } from "@/components/shared/search-input";
import { useAllKabupaten } from "@/features/master-data";
import { STATUS_LABELS } from "@/lib/constants/status";

interface ScheduleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  kabupatenId: string;
  onKabupatenChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function ScheduleFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  kabupatenId,
  onKabupatenChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: ScheduleFiltersProps) {
  const { data: kabupaten } = useAllKabupaten();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Cari berdasarkan wilayah..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        >
          <option value="all">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={kabupatenId}
          onChange={(e) => onKabupatenChange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-48"
        >
          <option value="">Semua Kabupaten</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Dari</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sampai</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
          />
        </div>
      </div>
    </div>
  );
}
