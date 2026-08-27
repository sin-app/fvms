"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface RegionOption {
  id: string;
  name: string;
}

interface ProposalFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  kabupatenId: string;
  kecamatanId: string;
  desaId: string;
  onKabupatenChange: (value: string) => void;
  onKecamatanChange: (value: string) => void;
  onDesaChange: (value: string) => void;
  kabupatenOptions: RegionOption[];
  kecamatanOptions: RegionOption[];
  desaOptions: RegionOption[];
  search: string;
  onSearchChange: (value: string) => void;
  showOnlyMine: boolean;
  onlyMine: boolean;
  onOnlyMineChange: (value: boolean) => void;
}

const selectClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm w-full sm:w-40";

export function ProposalFilters({
  status,
  onStatusChange,
  kabupatenId,
  kecamatanId,
  desaId,
  onKabupatenChange,
  onKecamatanChange,
  onDesaChange,
  kabupatenOptions,
  kecamatanOptions,
  desaOptions,
  search,
  onSearchChange,
  showOnlyMine,
  onlyMine,
  onOnlyMineChange,
}: ProposalFiltersProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-0">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Cari
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Member / Block / Plot / Doc / NIS"
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Semua</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Kabupaten
        </label>
        <select
          value={kabupatenId}
          onChange={(e) => onKabupatenChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Semua</option>
          {kabupatenOptions.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </div>

      {kabupatenId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Kecamatan
          </label>
          <select
            value={kecamatanId}
            onChange={(e) => onKecamatanChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua</option>
            {kecamatanOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {kecamatanId && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Desa
          </label>
          <select
            value={desaId}
            onChange={(e) => onDesaChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua</option>
            {desaOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showOnlyMine && (
        <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => onOnlyMineChange(e.target.checked)}
            className="h-4 w-4 accent-[--brand]"
          />
          Hanya milik saya
        </label>
      )}
    </div>
  );
}
