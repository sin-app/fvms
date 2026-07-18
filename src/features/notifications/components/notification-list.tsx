"use client";

import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "../hooks/use-notifications";
import { timeAgo } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const TYPE_ICONS: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  success: "✅",
  error: "❌",
};

export function NotificationList() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  if (isLoading) return <LoadingState variant="list" count={5} />;

  if (!notifications?.length) {
    return (
      <EmptyState
        title="Tidak ada notifikasi"
        description="Belum ada notifikasi untuk Anda."
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-1">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-xs text-muted-foreground">
            {unreadCount} belum dibaca
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            className="text-xs h-7"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Tandai semua dibaca
          </Button>
        </div>
      )}

      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={() => markAsRead.mutate(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        !notification.is_read && "bg-muted/50",
        "hover:bg-muted",
      )}
      onClick={() => {
        if (!notification.is_read) onMarkRead();
      }}
    >
      <span className="text-lg mt-0.5">
        {TYPE_ICONS[notification.type] ?? "ℹ️"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.is_read && "font-medium")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo(notification.created_at)}
        </p>
      </div>
    </div>
  );

  if (notification.link && isValidInternalPath(notification.link)) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}

function isValidInternalPath(link: string): boolean {
  return link.startsWith("/") && !link.startsWith("//");
}
