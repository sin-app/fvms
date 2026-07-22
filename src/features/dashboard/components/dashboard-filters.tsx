"use client";

import { useAllKabupaten, useAllKecamatan } from "@/features/master-data";
import { useAuth } from "@/features/auth/components/auth-context";

interface DashboardFiltersProps {
  kabupatenId: string;
  kecamatanId: string;
  onKabupatenChange: (v: string) => void;
  onKecamatanChange: (v: string) => void;
}

export function DashboardFilters({
  kabupatenId,
  kecamatanId,
  onKabupatenChange,
  onKecamatanChange,
}: DashboardFiltersProps) {
  const { user } = useAuth();
  const isPrivileged = user?.role === "admin" || user?.role === "qc";
  if (!isPrivileged) return null;

  const { data: allKabupaten } = useAllKabupaten();
  const scopeKabupatenIds = user?.role === "qc" ? (user.assigned_kabupaten_ids ?? []) : undefined;
  const kabupaten = scopeKabupatenIds
    ? (allKabupaten ?? []).filter((k) => scopeKabupatenIds.includes(k.id))
    : allKabupaten;
  const { data: kecamatan } = useAllKecamatan(kabupatenId);

  return (
    <div className="flex flex-wrap items-end gap-3">
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
    </div>
  );
}
