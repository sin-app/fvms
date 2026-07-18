"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/components/auth-context";
import { navItems } from "./nav-items";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!open) return null;

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r p-3 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b mb-2">
          <span className="font-bold text-lg">FVMS</span>
          <button onClick={onClose} aria-label="Tutup menu" className="p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        {visibleItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.label} className="space-y-1">
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-sm",
                      isActive(child.href)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                isActive(item.href!)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </aside>
    </div>
  );
}
