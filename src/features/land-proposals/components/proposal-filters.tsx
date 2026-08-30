"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { LandProposalStatus } from "@/types";

export interface RegionOption {
  id: string;
  name: string;
}

const PROPOSAL_STATUS_OPTIONS: { value: LandProposalStatus; label: string }[] = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "cancelled", label: "Dibatalkan" },
];

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
  total: number;
  resultCount: number;
  onReset: () => void;
  onlyMineHint?: string;
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
  total,
  resultCount,
  onReset,
  onlyMineHint,
}: ProposalFiltersProps) {
  const hasActiveFilter =
    status !== "" ||
    kabupatenId !== "" ||
    kecamatanId !== "" ||
    desaId !== "" ||
    search.trim() !== "" ||
    onlyMine;

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{resultCount}</span> dari{" "}
          {total} pengajuan
        </p>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 gap-1 px-2 text-xs"
          >
            <X className="h-3.5 w-3.5" /> Reset filter
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
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
          {PROPOSAL_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
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
          {onlyMineHint && (
            <span className="text-xs font-normal text-muted-foreground">
              ({onlyMineHint})
            </span>
          )}
        </label>
      )}
      </div>
    </div>
  );
}
