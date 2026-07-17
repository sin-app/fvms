"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { previewExcelFileAction, executeImportAction } from "../actions/import-actions";
import type { ImportPreview, ColumnMapping } from "../types";

export function useExcelImport() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const queryClient = useQueryClient();

  async function handleFileSelect(_file: File, base64: string) {
    setFileBase64(base64);
    setLoading(true);
    setResult(null);

    try {
      const res = await previewExcelFileAction(base64);
      if (res.success && res.data) {
        setPreview(res.data);
        // Auto-map columns
        const autoMapping: ColumnMapping = {};
        const targetLabels: Record<string, string[]> = {
          user_name: ["petugas", "nama petugas", "user", "nama", "name", "officer"],
          kabupaten_name: ["kabupaten", "kab", "kota", "city"],
          kecamatan_name: ["kecamatan", "kec", "district"],
          desa_name: ["desa", "village", "kelurahan"],
          visit_date: ["tanggal", "date", "tgl", "visit date", "kunjungan", "visit_date"],
        };

        for (const [target, keywords] of Object.entries(targetLabels)) {
          const match = res.data.columns.find((col) =>
            keywords.some((kw) => col.toLowerCase().includes(kw)),
          );
          if (match) autoMapping[target] = match;
        }

        setMapping(autoMapping);
      } else {
        toast.error(res.error ?? "Gagal membaca file");
      }
    } catch {
      toast.error("Gagal memproses file");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!fileBase64 || Object.keys(mapping).length < 5) {
      toast.error("Lengkapi mapping kolom terlebih dahulu");
      return;
    }

    setImporting(true);
    const fd = new FormData();
    fd.set("file", fileBase64);
    fd.set("mapping", JSON.stringify(mapping));

    try {
      const res = await executeImportAction({ success: false }, fd);
      if (res.success && res.data) {
        setResult({ success: res.data.success, errors: res.data.errors });
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        toast.success(`Import berhasil: ${res.data.success} jadwal ditambahkan`);
      } else {
        toast.error(res.error ?? "Gagal import");
      }
    } catch {
      toast.error("Gagal menjalankan import");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setPreview(null);
    setMapping({});
    setFileBase64(null);
    setResult(null);
  }

  return {
    preview,
    mapping,
    loading,
    importing,
    result,
    handleFileSelect,
    setMapping,
    handleImport,
    reset,
  };
}
