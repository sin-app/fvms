"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { LayoutDashboard, CalendarCheck, CalendarDays, BarChart3, Database, FileSpreadsheet, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/components/auth-context";

const BASE_BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedules", label: "Jadwal", icon: CalendarCheck },
  { href: "/schedules/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

const ADMIN_BOTTOM_NAV_ITEMS = [
  { href: "/master-data/kabupaten", label: "Master Data", icon: Database },
  { href: "/import", label: "Import", icon: FileSpreadsheet },
  { href: "/users", label: "Users", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items =
    user?.role === "admin"
      ? [
          BASE_BOTTOM_NAV_ITEMS[0],
          ADMIN_BOTTOM_NAV_ITEMS[0],
          BASE_BOTTOM_NAV_ITEMS[1],
          BASE_BOTTOM_NAV_ITEMS[2],
          ADMIN_BOTTOM_NAV_ITEMS[1],
          BASE_BOTTOM_NAV_ITEMS[3],
          ADMIN_BOTTOM_NAV_ITEMS[2],
          BASE_BOTTOM_NAV_ITEMS[4],
        ]
      : BASE_BOTTOM_NAV_ITEMS;

  const cols = items.length === 8 ? "grid-cols-4" : "grid-cols-5";

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/schedules") return pathname === "/schedules";
    if (href === "/master-data/kabupaten") return pathname.startsWith("/master-data/");
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className={cn("grid min-h-[64px]", cols)}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors min-h-[52px]",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-[22px] w-[22px]" strokeWidth={isActive(item.href) ? 2.5 : 2} />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
