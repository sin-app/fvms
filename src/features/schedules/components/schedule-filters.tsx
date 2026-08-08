"use client";

import { useAllKabupaten, useAllKecamatan, useDesaFilterOptions } from "@/features/master-data";
import { useAllUsers } from "../hooks/use-users";
import { useDistinctFilterValues } from "../hooks/use-distinct-values";
import { DistinctFilterSelect } from "@/components/shared/distinct-filter-select";
import type { DistinctFiltersInput } from "../types";
import { STATUS_LABELS } from "@/lib/constants/status";
import { dateString } from "@/lib/utils/date";

interface ScheduleFiltersProps {
  memberName: string;
  onMemberNameChange: (value: string) => void;
  blockNo: string;
  onBlockNoChange: (value: string) => void;
  noPlot: string;
  onNoPlotChange: (value: string) => void;
  nis: string;
  onNisChange: (value: string) => void;
  documentNo: string;
  onDocumentNoChange: (value: string) => void;
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
  desaId: string;
  onDesaChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  varietas: string;
  onVarietasChange: (value: string) => void;
  panenStatus?: string;
  onPanenStatusChange?: (value: string) => void;
  label: string;
  onLabelChange: (value: string) => void;
  hidePetugasFilter?: boolean;
  /** Filter aktif yang membatasi opsi dropdown lain (relasi cascading). */
  relations?: DistinctFiltersInput;
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
        from: dateString(start),
        to: dateString(end),
      };
    }
    case "month": {
      const last = new Date(y, now.getMonth() + 1, 0);
      return {
        from: `${y}-${m}-01`,
        to: dateString(last),
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
  documentNo,
  onDocumentNoChange,
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
  desaId,
  onDesaChange,
  dateRange,
  onDateRangeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  varietas,
  onVarietasChange,
  panenStatus = "all",
  onPanenStatusChange,
  label = "all",
  onLabelChange,
  hidePetugasFilter = false,
  relations,
}: ScheduleFiltersProps) {
  const { data: kabupaten } = useAllKabupaten();
  const { data: kecamatan } = useAllKecamatan(kabupatenId);
  const { data: users } = useAllUsers(kabupatenId);
  const { data: distinctValues } = useDistinctFilterValues(relations);
  const { data: desa } = useDesaFilterOptions(kabupatenId || undefined);

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
    onDesaChange("");
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
        <DistinctFilterSelect
          value={blockNo}
          onChange={onBlockNoChange}
          label="Block"
          options={distinctValues?.block_no}
        />
        <DistinctFilterSelect
          value={noPlot}
          onChange={onNoPlotChange}
          label="Plot"
          options={distinctValues?.no_plot}
        />
        <DistinctFilterSelect
          value={nis}
          onChange={onNisChange}
          label="NIS"
          options={distinctValues?.nis}
        />
        <DistinctFilterSelect
          value={documentNo}
          onChange={onDocumentNoChange}
          label="Doc No"
          options={distinctValues?.document_no}
        />
        <DistinctFilterSelect
          value={cgr}
          onChange={onCgrChange}
          label="CGR"
          options={distinctValues?.cgr}
        />
        {onPanenStatusChange && (
          <select
            value={panenStatus}
            onChange={(e) => onPanenStatusChange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-40"
          >
            <option value="all">Semua Panen</option>
            <option value="sudah">Sudah Panen</option>
            <option value="jatuh_tempo">Jatuh Tempo</option>
            <option value="belum">Belum Panen</option>
          </select>
        )}
        <select
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-36"
        >
          <option value="all">Semua Label</option>
          <option value="hijau">Hijau</option>
          <option value="kuning">Kuning</option>
          <option value="merah">Merah</option>
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
        {kabupatenId && (
          <select
            value={desaId}
            onChange={(e) => onDesaChange(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm w-full sm:w-44"
          >
            <option value="">Semua Desa</option>
            {desa?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
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
