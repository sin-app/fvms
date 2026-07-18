"use client";

import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { FileUploader, ColumnMapper, useExcelImport } from "@/features/excel-import";

export default function ImportPage() {
  const {
    preview,
    mapping,
    loading,
    importing,
    result,
    handleFileSelect,
    setMapping,
    handleImport,
    reset,
  } = useExcelImport();

  const allMapped = Object.keys(mapping).length >= 5;

  return (
    <div className="space-y-6 mx-auto max-w-5xl">
      <PageHeader
        title="Import Excel"
        description="Import jadwal kunjungan dari file Excel"
        actions={
          <Link href="/schedules">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali
            </Button>
          </Link>
        }
      />

      {!preview && (
        <FileUploader onFileSelect={handleFileSelect} loading={loading} />
      )}

      {preview && !result && (
        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <ColumnMapper
              preview={preview}
              mapping={mapping}
              onMappingChange={setMapping}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <p className="text-sm text-muted-foreground">
              {preview.totalRows} baris data siap diimport
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Batal
              </Button>
              <Button onClick={handleImport} disabled={!allMapped || importing}>
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Mengimport...</>
                ) : (
                  "Import Data"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-xl border p-6 text-center space-y-4">
          {result.errors === 0 ? (
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          ) : (
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
          )}
           <div>
             <h3 className="text-lg font-semibold">Import Selesai</h3>
             <p className="text-sm text-muted-foreground mt-1">
               {result.success} berhasil, {result.errors} gagal
             </p>
             {result.created && (result.created.kabupaten > 0 || result.created.kecamatan > 0 || result.created.desa > 0) && (
               <p className="text-xs text-muted-foreground mt-2">
                 Master data otomatis dibuat: {result.created.kabupaten} kabupaten,{" "}
                 {result.created.kecamatan} kecamatan, {result.created.desa} desa
               </p>
             )}
           </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              Import Lagi
            </Button>
            <Link href="/schedules">
              <Button>Lihat Jadwal</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
