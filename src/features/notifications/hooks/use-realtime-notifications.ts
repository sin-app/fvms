"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/components/auth-context";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    try {
      channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          },
        )
        .subscribe();
    } catch {
      return;
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
