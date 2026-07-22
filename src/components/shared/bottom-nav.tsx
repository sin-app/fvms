"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { useAuth } from "@/features/auth/components/auth-context";

interface FlatItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

function flatten(items: typeof navItems): FlatItem[] {
  const out: FlatItem[] = [];
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        out.push({ href: child.href, label: child.label, icon: item.icon, adminOnly: item.adminOnly });
      }
    } else if (item.href) {
      out.push({ href: item.href, label: item.label, icon: item.icon, adminOnly: item.adminOnly });
    }
  }
  return out;
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = flatten(navItems).filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  const allItems: FlatItem[] = [
    ...items,
    { href: "/profile", label: "Profile", icon: User },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/schedules") return pathname === "/schedules";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center gap-0 min-h-[64px] overflow-x-auto no-scrollbar px-1">
        {allItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] font-medium transition-colors shrink-0 min-w-[64px] min-h-[52px] rounded-lg",
              isActive(item.href)
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-[22px] w-[22px]" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
