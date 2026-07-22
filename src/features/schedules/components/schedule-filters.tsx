"use client";

import { useAllKabupaten, useAllKecamatan } from "@/features/master-data";
import { useAllCgr } from "../hooks/use-cgr";
import { useAllUsers } from "../hooks/use-users";
import { STATUS_LABELS } from "@/lib/constants/status";

interface ScheduleFiltersProps {
  memberName: string;
  onMemberNameChange: (value: string) => void;
  blockNo: string;
  onBlockNoChange: (value: string) => void;
  noPlot: string;
  onNoPlotChange: (value: string) => void;
  nis: string;
  onNisChange: (value: string) => void;
  tglTanam: string;
  onTglTanamChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
  cgr: string;
  onCgrChange: (value: string) => void;
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
  varietas: string;
  onVarietasChange: (value: string) => void;
  hidePetugasFilter?: boolean;
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
  memberName,
  onMemberNameChange,
  blockNo,
  onBlockNoChange,
  noPlot,
  onNoPlotChange,
  nis,
  onNisChange,
  tglTanam,
  onTglTanamChange,
  status,
  onStatusChange,
  userId,
  onUserIdChange,
  cgr,
  onCgrChange,
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
  varietas,
  onVarietasChange,
  hidePetugasFilter = false,
}: ScheduleFiltersProps) {
  const { data: kabupaten } = useAllKabupaten();
  const { data: kecamatan } = useAllKecamatan(kabupatenId);
  const { data: users } = useAllUsers();
  const { data: cgrList } = useAllCgr();

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
        <input
          value={memberName}
          onChange={(e) => onMemberNameChange(e.target.value)}
          placeholder="Nama Member"
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-52"
        />
        <input
          value={varietas}
          onChange={(e) => onVarietasChange(e.target.value)}
          placeholder="Kode Varietas (mis. JP-06)"
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-52"
        />
        <input
          value={blockNo}
          onChange={(e) => onBlockNoChange(e.target.value)}
          placeholder="Block"
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-36"
        />
        <input
          value={noPlot}
          onChange={(e) => onNoPlotChange(e.target.value)}
          placeholder="Plot"
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-36"
        />
        <input
          value={nis}
          onChange={(e) => onNisChange(e.target.value)}
          placeholder="NIS"
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        />
        <input
          value={tglTanam}
          onChange={(e) => onTglTanamChange(e.target.value)}
          placeholder="Tgl Tanam"
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
        />
        <select
          value={cgr}
          onChange={(e) => onCgrChange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-48"
        >
          <option value="">Semua CGR</option>
          {cgrList?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
        {!hidePetugasFilter && (
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
        )}
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
