"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  "/users": "Users",
};

export function AppHeader() {
  const pathname = usePathname();
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  )?.[1] ?? "FVMS";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="sm:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="flex-1 text-lg font-semibold sm:text-xl">{title}</h1>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    </header>
  );
}
