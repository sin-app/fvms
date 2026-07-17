"use client";

import { useAllKabupaten } from "../hooks/use-kabupaten";
import { useAllKecamatan } from "../hooks/use-kecamatan";
import { useAllDesa } from "../hooks/use-desa";

interface RegionSelectorProps {
  kabupatenId?: string;
  kecamatanId?: string;
  desaId?: string;
  onKabupatenChange: (id: string) => void;
  onKecamatanChange: (id: string) => void;
  onDesaChange: (id: string) => void;
  showDesa?: boolean;
}

export function RegionSelector({
  kabupatenId,
  kecamatanId,
  desaId,
  onKabupatenChange,
  onKecamatanChange,
  onDesaChange,
  showDesa = true,
}: RegionSelectorProps) {
  const { data: kabupaten } = useAllKabupaten();
  const { data: kecamatan } = useAllKecamatan(kabupatenId ?? "");
  const { data: desa } = useAllDesa(kecamatanId ?? "");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Kabupaten</label>
        <select
          value={kabupatenId ?? ""}
          onChange={(e) => {
            onKabupatenChange(e.target.value);
            onKecamatanChange("");
            onDesaChange("");
          }}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Pilih Kabupaten</option>
          {kabupaten?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Kecamatan</label>
        <select
          value={kecamatanId ?? ""}
          onChange={(e) => {
            onKecamatanChange(e.target.value);
            onDesaChange("");
          }}
          disabled={!kabupatenId}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Pilih Kecamatan</option>
          {kecamatan?.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
      </div>

      {showDesa && (
        <div>
          <label className="text-sm font-medium mb-1 block">Desa</label>
          <select
            value={desaId ?? ""}
            onChange={(e) => onDesaChange(e.target.value)}
            disabled={!kecamatanId}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">Pilih Desa</option>
            {desa?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
