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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success: number;
    errors: number;
    duplicates?: number;
    replaced?: number;
    created?: { kabupaten: number; kecamatan: number; desa: number; users: number };
  } | null>(null);
  const queryClient = useQueryClient();

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    setLoading(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await previewExcelFileAction(fd);
      if (res.success && res.data) {
        setPreview(res.data);
        // Auto-map columns
        const autoMapping: ColumnMapping = {};
        const targetLabels: Record<string, string[]> = {
          user_name: ["staff", "petugas", "nama petugas", "petugas lapang", "field officer", "officer", "user", "nama", "name", "pelaksana", "penanggung jawab"],
          kabupaten_name: ["kab", "kabupaten", "kota", "city"],
          kecamatan_name: ["kec", "kecamatan", "district"],
          desa_name: ["desa", "village", "kelurahan"],
          visit_date: ["detaseling", "tanggal kunjungan", "visit date", "visit_date"],
          tgl_tanam: ["tgl tanam", "tanggal tanam", "planting date"],
          cgr: ["cgr"],
          cgr_code: ["cgr code", "cgr_code"],
          block_no: ["block no", "block", "blok"],
          no_plot: ["no plot", "plot", "no plot"],
          member_name: ["member name", "member", "nama member", "anggota"],
          document_no: ["document no", "doc no", "document", "no dokumen", "dokumen"],
          ph_tanah: ["ph tanah", "ph", "ph tanah"],
          nis: ["nis"],
          real_tanam_ha: ["real tanam ha", "real tanam", "luas tanam"],
          gagal_tanam: ["gagal tanam"],
          sisa_di_lahan_ha: ["sisa di lahan ha", "sisa lahan", "sisa di lahan"],
          visit_time: ["jam", "waktu", "time", "visit time", "pukul"],
          latitude: ["latitude", "lat", "ls", "lintang"],
          longitude: ["longitude", "lng", "lon", "long", "bt", "bujur"],
          accuracy: ["accuracy", "akurasi", "presisi"],
          notes: ["catatan", "keterangan", "notes", "note", "keterangan tambahan"],
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
    if (!selectedFile || Object.keys(mapping).length < 5) {
      toast.error("Lengkapi mapping kolom terlebih dahulu");
      return;
    }

    setImporting(true);
    const fd = new FormData();
    fd.set("file", selectedFile);
    fd.set("mapping", JSON.stringify(mapping));

    try {
      const res = await executeImportAction({ success: false }, fd);
      if (res.success && res.data) {
        setResult({
          success: res.data.success,
          errors: res.data.errors,
          duplicates: res.data.duplicates,
          replaced: res.data.replaced,
          created: res.data.created,
        });
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        queryClient.invalidateQueries({ queryKey: ["master-data"] });
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
    setSelectedFile(null);
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
