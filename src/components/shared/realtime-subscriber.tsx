"use client";

import { useRealtimeNotifications } from "@/features/notifications";

export function RealtimeSubscriber() {
  useRealtimeNotifications();
  return null;
}
