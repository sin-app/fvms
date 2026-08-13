"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsReadAction,
  markAllAsReadAction,
} from "../api/notification-client";
import { getOfflineDb, isOfflineDbAvailable } from "@/lib/offline/db";
import { queueMutation } from "@/lib/offline/engine";
import { useSync } from "@/lib/offline/sync-context";

function offlineDb() {
  return isOfflineDbAvailable() ? getOfflineDb() : null;
}

export function useNotifications() {
  const { online, hydrateVersion } = useSync();
  return useQuery({
    queryKey: ["notifications", { online, hydrateVersion }],
    queryFn: async () => {
      if (!online) {
        const db = offlineDb();
        if (db) {
          const rows = await db.notifications.orderBy("created_at").reverse().toArray();
          if (rows.length) return rows as unknown as Awaited<ReturnType<typeof fetchNotifications>>;
        }
      }
      return fetchNotifications();
    },
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  const { online, hydrateVersion } = useSync();
  return useQuery({
    queryKey: ["notifications", "unread", { online, hydrateVersion }],
    queryFn: async () => {
      if (!online) {
        const db = offlineDb();
        if (db) {
          return db.notifications.filter((n) => !n.is_read).count();
        }
      }
      return fetchUnreadCount();
    },
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!online) {
        const db = offlineDb();
        if (db) {
          await db.notifications.update(id, { is_read: true });
          await queueMutation({
            table: "notifications",
            action: "upsert",
            entity_id: id,
            payload: { id, is_read: true },
          });
          return;
        }
      }
      return markAsReadAction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
    onError: () => toast.error("Gagal menandai notifikasi"),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async () => {
      if (!online) {
        const db = offlineDb();
        if (db) {
          const unread = await db.notifications.filter((n) => !n.is_read).toArray();
          await db.notifications.where("id").anyOf(unread.map((n) => n.id)).modify({ is_read: true });
          for (const n of unread) {
            await queueMutation({
              table: "notifications",
              action: "upsert",
              entity_id: n.id,
              payload: { id: n.id, is_read: true },
            });
          }
          return;
        }
      }
      return markAllAsReadAction();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
    onError: () => toast.error("Gagal menandai semua notifikasi"),
  });
}
