"use client";

import { CloudOff, RefreshCw, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSync } from "@/lib/offline/sync-context";

export function SyncIndicator() {
  const { online, syncing, pending, lastError, syncNow } = useSync();

  if (!online) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        title={lastError ?? "Tidak ada koneksi"}
      >
        <CloudOff className="h-3.5 w-3.5" />
        Offline
      </span>
    );
  }

  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Sinkron
      </span>
    );
  }

  if (pending > 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => void syncNow()}
        className={cn(
          "h-7 gap-1.5 rounded-full px-2.5 text-[11px] font-semibold",
          lastError ? "border-amber-300 text-amber-700" : "border-brand/30 text-brand",
        )}
        title={lastError ?? `${pending} perubahan belum dikirim`}
      >
        <CloudUpload className="h-3.5 w-3.5" />
        {pending} menunggu
      </Button>
    );
  }

  // Online & idle: tombol sinkron manual selalu tersedia agar data
  // terbaru (mis. hasil import admin) bisa ditarik tanpa logout-login.
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void syncNow()}
      className="h-7 gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-brand"
      title="Sinkronkan data terbaru"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Sinkron
    </Button>
  );
}