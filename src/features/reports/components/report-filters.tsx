"use client";

import { useAllKabupaten } from "@/features/master-data";
import { useAllKecamatan } from "@/features/master-data";
import { useAllUsers } from "@/features/schedules/hooks/use-users";

interface ReportFiltersProps {
  dateFrom: string;
  dateTo: string;
  userId: string;
  kabupatenId: string;
  kecamatanId: string;
  showUserFilter: boolean;
  scopeKabupatenIds?: string[];
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onUserChange: (v: string) => void;
  onKabupatenChange: (v: string) => void;
  onKecamatanChange: (v: string) => void;
  onReset: () => void;
}

export function ReportFiltersView({
  dateFrom,
  dateTo,
  userId,
  kabupatenId,
  kecamatanId,
  showUserFilter,
  scopeKabupatenIds,
  onDateFromChange,
  onDateToChange,
  onUserChange,
  onKabupatenChange,
  onKecamatanChange,
  onReset,
}: ReportFiltersProps) {
  const { data: users } = useAllUsers();
  const { data: allKabupaten } = useAllKabupaten();
  const { data: kecamatan } = useAllKecamatan(kabupatenId);
  const kabupaten = scopeKabupatenIds
    ? (allKabupaten ?? []).filter((k) => scopeKabupatenIds.includes(k.id))
    : allKabupaten;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Dari</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-36"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Sampai</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-36"
        />
      </div>
      {showUserFilter && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Produksi</label>
          <select
            value={userId}
            onChange={(e) => onUserChange(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-40"
          >
            <option value="">Semua</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Kabupaten</label>
        <select
          value={kabupatenId}
          onChange={(e) => {
            onKabupatenChange(e.target.value);
            onKecamatanChange("");
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-40"
        >
          <option value="">Semua</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>
      {kabupatenId && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Kecamatan</label>
          <select
            value={kecamatanId}
            onChange={(e) => onKecamatanChange(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-40"
          >
            <option value="">Semua</option>
            {kecamatan?.map((k) => (
              <option key={k.id} value={k.id}>{k.name}</option>
            ))}
          </select>
        </div>
      )}
      <button
        onClick={onReset}
        className="h-9 px-3 rounded-lg border border-input text-sm hover:bg-muted transition-colors"
      >
        Reset
      </button>
    </div>
  );
}
