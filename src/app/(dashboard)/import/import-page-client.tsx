"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { FileUploader, ColumnMapper, useExcelImport } from "@/features/excel-import";
import { resetAllDataAction } from "@/features/excel-import/actions/import-actions";

export function ImportPageInner() {
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
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const allMapped = Object.keys(mapping).length >= 5;

  async function confirmReset() {
    setResetting(true);
    try {
      const res = await resetAllDataAction();
      if (!res.success) throw new Error(res.error);
      toast.success("Semua data operasional dihapus. User admin & QC dipertahankan.");
      setShowReset(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal reset data";
      toast.error(msg);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6 mx-auto max-w-5xl">
      <PageHeader
        title="Import Excel"
        description="Import jadwal kunjungan dari file Excel"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReset(true)}
              disabled={resetting}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Reset Semua Data
            </Button>
            <Link href="/schedules">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Kembali
              </Button>
            </Link>
          </div>
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
               {result.success} berhasil
               {result.errors > 0 && (
                 <>, {result.errors} gagal</>
               )}
               {result.duplicates ? (
                 <>, {result.duplicates} duplikat dilewati</>
               ) : null}
                {result.replaced ? (
                  <>, {result.replaced} diperbarui</>
                ) : null}
             </p>
              {result.created && (result.created.kabupaten > 0 || result.created.kecamatan > 0 || result.created.desa > 0 || result.created.users > 0) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Otomatis dibuat: {result.created.kabupaten} kabupaten,{" "}
                  {result.created.kecamatan} kecamatan, {result.created.desa} desa
                  {result.created.users > 0 && (
                    <>, {result.created.users} produksi</>
                  )}
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

      <ConfirmDialog
        open={showReset}
        onOpenChange={(o) => !o && setShowReset(false)}
        title="Reset Semua Data"
        message="Semua jadwal, foto, catatan, dan log aktivitas akan dihapus secara permanen. User Produksi juga dihapus. User Admin dan QC dipertahankan. Lanjutkan?"
        confirmLabel="Reset & Hapus"
        variant="destructive"
        onConfirm={confirmReset}
        loading={resetting}
      />
    </div>
  );
}
