"use client";

import type { ImportPreview } from "../types";

const TARGET_FIELDS = [
  { key: "user_name", label: "Nama Petugas *" },
  { key: "kabupaten_name", label: "Kabupaten *" },
  { key: "kecamatan_name", label: "Kecamatan *" },
  { key: "desa_name", label: "Desa *" },
  { key: "visit_date", label: "Tanggal Kunjungan *" },
  { key: "visit_time", label: "Jam Kunjungan" },
  { key: "tgl_tanam", label: "Tgl Tanam" },
  { key: "cgr", label: "CGR" },
  { key: "cgr_code", label: "CGR Code" },
  { key: "block_no", label: "Block No" },
  { key: "no_plot", label: "No Plot" },
  { key: "member_name", label: "Member Name" },
  { key: "real_tanam_ha", label: "Real Tanam (HA)" },
  { key: "gagal_tanam", label: "Gagal Tanam" },
  { key: "sisa_di_lahan_ha", label: "Sisa LahAN (HA)" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
  { key: "accuracy", label: "Akurasi (m)" },
  { key: "notes", label: "Catatan" },
];

interface ColumnMapperProps {
  preview: ImportPreview;
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export function ColumnMapper({ preview, mapping, onMappingChange }: ColumnMapperProps) {
  function handleChange(targetField: string, sourceColumn: string) {
    onMappingChange({ ...mapping, [targetField]: sourceColumn });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Mapping Kolom</h3>
      <p className="text-xs text-muted-foreground">
        Cocokkan kolom dari file Excel dengan field yang tersedia.
      </p>

      <div className="space-y-2">
        {TARGET_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-3">
            <span className="text-sm w-40 shrink-0">{field.label}</span>
            <select
              value={mapping[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="flex-1 h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Pilih kolom...</option>
              {preview.columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Pratinjau Data</h4>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {preview.columns.map((col) => (
                  <th key={col} className="p-2 text-left font-medium whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i} className="border-t">
                  {preview.columns.map((col) => (
                    <td key={col} className="p-2 whitespace-nowrap max-w-[200px] truncate">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
