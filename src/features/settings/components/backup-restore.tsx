"use client";

import { useState } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, FileJson } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportBackupAction, importBackupAction } from "../actions/backup-actions";

export function BackupRestore({ isAdmin }: { isAdmin: boolean }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [lastImport, setLastImport] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportBackupAction();
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Gagal membuat backup");
        return;
      }
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename ?? "fvms-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await importBackupAction(null, formData);
      if (result.success) {
        setLastImport(file.name);
        toast.success("Backup berhasil di-restore");
      } else {
        toast.error(result.error ?? "Gagal import backup");
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Unduh seluruh data Anda (sesuai peran) sebagai file JSON, atau pulihkan data dari file
        backup. Foto hanya ikut sebagai metadata — file asli foto tidak disertakan.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="min-h-11"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download Backup
        </Button>

        {isAdmin && (
          <label
            className={`inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 min-h-11 text-sm font-medium shadow-sm hover:bg-muted transition-colors cursor-pointer ${importing ? "pointer-events-none opacity-70" : ""}`}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {importing ? "Memproses..." : "Import Backup"}
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                void handleImport(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      {isAdmin && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Import tersedia untuk admin. Data di-restore dengan cara ditambahkan/diperbarui
            (upsert) — tidak ada data yang dihapus.
          </p>
          <p className="flex items-center gap-1.5">
            <FileJson className="h-3.5 w-3.5" />
            Hanya file backup FVMS (.json) yang didukung, maksimal 5MB.
          </p>
          {lastImport && (
            <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Terakhir di-restore: {fileName || lastImport}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
