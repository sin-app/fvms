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
        <div className="gradient-brand flex items-center justify-center size-8 shrink-0 rounded-lg shadow-brand-glow">
          <Sprout className="size-4.5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">FVMS</h1>
        <span className="hidden w-px h-5 bg-border sm:block" />
        <span className="hidden text-sm font-medium truncate sm:block">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground ml-2">
          <span className="font-medium">{user?.name}</span>
        </div>
        {user && (
          <div className="flex sm:hidden items-center justify-center size-9 rounded-full bg-brand-soft text-xs font-bold text-brand ml-1 ring-1 ring-brand/20">
            {(user.name?.[0] ?? "?").toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
