"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsReadAction,
  markAllAsReadAction,
} from "../api/notification-client";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsReadAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Gagal menandai notifikasi"),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsReadAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Gagal menandai semua notifikasi"),
  });
}
