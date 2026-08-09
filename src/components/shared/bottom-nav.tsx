"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck2, CalendarDays, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/schedules", label: "Jadwal", icon: CalendarCheck2 },
  { href: "/schedules/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/schedules") return pathname === "/schedules";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
      <div className="px-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]">
        <div className="pointer-events-auto rounded-2xl border bg-background/90 backdrop-blur-xl shadow-lg shadow-black/5">
          <div className="grid grid-cols-5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all py-2.5 min-h-[56px]",
                    active ? "text-brand" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-x-2 top-1 bottom-1 -z-10 rounded-xl transition-all",
                      active && "bg-brand-soft shadow-brand-glow",
                    )}
                  />
                  <item.icon
                    className="h-[22px] w-[22px] transition-transform"
                    strokeWidth={active ? 2.4 : 2}
                  />
                  <span className="whitespace-nowrap font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}