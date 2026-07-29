"use client";

import { Sprout } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/components/auth-context";
import { NotificationBell } from "@/features/notifications";
import { ThemeToggle } from "./theme-toggle";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/master-data/kabupaten": "Master Data - Kabupaten",
  "/master-data/kecamatan": "Master Data - Kecamatan",
  "/master-data/desa": "Master Data - Desa",
  "/schedules": "Jadwal",
  "/schedules/calendar": "Kalender",
  "/visits": "Detail Kunjungan",
  "/import": "Import Excel",
  "/reports": "Laporan",
  "/notifications": "Notifikasi",
  "/profile": "Profile",
  "/settings": "Pengaturan",
  "/users": "Users",
};

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  )?.[1] ?? "FVMS";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Sprout className="size-6 shrink-0 text-primary" />
        <h1 className="font-bold text-lg tracking-tight">FVMS</h1>
        <span className="hidden sm:block w-px h-5 bg-border" />
        <span className="hidden sm:block text-sm font-medium truncate">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground ml-2">
          <span className="font-medium">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
