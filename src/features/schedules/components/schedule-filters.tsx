"use client";

import { SearchInput } from "@/components/shared/search-input";
import { useAllKabupaten, useAllKecamatan } from "@/features/master-data";
import { useAllUsers } from "../hooks/use-users";
import { STATUS_LABELS } from "@/lib/constants/status";

interface ScheduleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
  kabupatenId: string;
  onKabupatenChange: (value: string) => void;
  kecamatanId: string;
  onKecamatanChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

const DATE_PRESETS = [
  { value: "", label: "Semua Tanggal" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "custom", label: "Kustom" },
];

function getDateRange(preset: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${d}`;

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        from: start.toISOString().split("T")[0],
        to: end.toISOString().split("T")[0],
      };
    }
    case "month": {
      const last = new Date(y, now.getMonth() + 1, 0);
      return {
        from: `${y}-${m}-01`,
        to: last.toISOString().split("T")[0],
      };
    }
    default:
      return { from: "", to: "" };
  }
}

export function ScheduleFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  userId,
  onUserIdChange,
  kabupatenId,
  onKabupatenChange,
  kecamatanId,
  onKecamatanChange,
  dateRange,
  onDateRangeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: ScheduleFiltersProps) {
  const { data: kabupaten } = useAllKabupaten();
  const { data: kecamatan } = useAllKecamatan(kabupatenId);
  const { data: users } = useAllUsers();

  function handleDateRange(value: string) {
    onDateRangeChange(value);
    if (value !== "custom") {
      const range = getDateRange(value);
      onDateFromChange(range.from);
      onDateToChange(range.to);
    }
  }

  function handleKabupaten(value: string) {
    onKabupatenChange(value);
    onKecamatanChange("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Cari berdasarkan wilayah..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-36"
        >
          <option value="all">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-44"
        >
          <option value="">Semua Produksi</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select
          value={kabupatenId}
          onChange={(e) => handleKabupaten(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-44"
        >
          <option value="">Semua Kabupaten</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
        {kabupatenId && (
          <select
            value={kecamatanId}
            onChange={(e) => onKecamatanChange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-44"
          >
            <option value="">Semua Kecamatan</option>
            {kecamatan?.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <select
          value={dateRange}
          onChange={(e) => handleDateRange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        {dateRange === "custom" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Dari</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Sampai</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
            />
          </div>
        )}
      </div>
    </div>
  );
}
