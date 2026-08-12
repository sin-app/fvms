"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import { clearOfflineData, clearServiceWorkerCaches } from "@/lib/offline/db";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() =>
        startTransition(async () => {
          await logoutAction();
        })
      }
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          // Bersihkan data sensitif lokal (IndexedDB offline + cache SW)
          // sebelum logout server agar tidak tertinggal di perangkat.
          try {
            await clearServiceWorkerCaches();
          } catch {
            // ignore: caches API tidak tersedia
          }
          try {
            await clearOfflineData();
          } catch {
            // ignore: data offline sudah kosong
          }
          await logoutAction();
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </form>
  );
}