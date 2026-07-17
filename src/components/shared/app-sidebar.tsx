"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Database,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Users,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { href: "/master-data/kabupaten", label: "Kabupaten" },
      { href: "/master-data/kecamatan", label: "Kecamatan" },
      { href: "/master-data/desa", label: "Desa" },
    ],
  },
  { href: "/schedules", label: "Jadwal", icon: CalendarCheck },
  { href: "/schedules/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/import", label: "Import Excel", icon: FileSpreadsheet },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/users", label: "Users", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(
    () => new Set(["Master Data"]),
  );

  function toggleMenu(label: string) {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden sm:flex flex-col w-60 border-r bg-card shrink-0">
      <div className="p-5 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">FVMS</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if ("children" in item) {
            const isExpanded = expandedMenus.has(item.label);
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href!)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  );
}
