"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Database,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSync } from "@/lib/offline/sync-context";
import { getOfflineDb, isOfflineDbAvailable } from "@/lib/offline/db";
import { formatDateTime, timeAgo } from "@/lib/utils/date";

export function SyncSettings() {
  const { online, syncing, pending, lastSyncAt, lastError, syncNow } = useSync();
  const [localSchedules, setLocalSchedules] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refreshLocalCount = useCallback(() => {
    if (!isOfflineDbAvailable()) return Promise.resolve(false);
    return getOfflineDb()
      .schedules.count()
      .then((count) => {
        setLocalSchedules(count);
        return true;
      })
      .catch(() => {
        setLocalSchedules(null);
        return false;
      });
  }, []);

  useEffect(() => {
    if (!isOfflineDbAvailable()) return;
    let cancelled = false;
    getOfflineDb()
      .schedules.count()
      .then((count) => {
        if (!cancelled) setLocalSchedules(count);
      })
      .catch(() => {
        if (!cancelled) setLocalSchedules(null);
      });
    return () => {
      cancelled = true;
    };
  }, [syncing]);

  async function handleSync() {
    if (syncing || !online) return;
    try {
      const hydrate = await syncNow();
      if (hydrate) {
        setLastResult(
          `${hydrate.schedules} jadwal, ${hydrate.visitNotes} catatan kunjungan, ${hydrate.regions} wilayah, ${hydrate.activityLogs} aktivitas`,
        );
        toast.success("Sinkronisasi selesai");
      }
      void refreshLocalCount();
    } catch {
      toast.error("Sinkronisasi gagal — periksa koneksi Anda");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tarik seluruh data terbaru dari server (termasuk hasil import) ke penyimpanan offline
        perangkat ini, agar semua halaman menampilkan data terkini tanpa perlu logout-login.
        Untuk admin, sinkronisasi mencakup seluruh data.
      </p>

      <div className="flex flex-col gap-2 text-sm">
        <p className="flex items-center gap-2">
          <Database className="h-4 w-4 text-brand" />
          {localSchedules === null ? "…" : localSchedules.toLocaleString("id-ID")} jadwal
          tersimpan offline di perangkat ini
        </p>
        {!online && (
          <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <CloudOff className="h-4 w-4" />
            Tidak ada koneksi — sinkronisasi dinonaktifkan
          </p>
        )}
        {pending > 0 && (
          <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            {pending} perubahan menunggu dikirim
          </p>
        )}
        {lastSyncAt && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Sinkron terakhir: {timeAgo(new Date(lastSyncAt))} ({formatDateTime(new Date(lastSyncAt))})
          </p>
        )}
        {lastError && (
          <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {lastError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing || !online}
          className="min-h-11 w-fit"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {syncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
        </Button>
        {lastResult && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Terakhir ditarik: {lastResult}
          </p>
        )}
      </div>
    </div>
  );
}