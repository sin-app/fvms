"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadCount } from "../hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: count = 0 } = useUnreadCount();

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground",
            "text-[10px] font-bold leading-none px-1",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
