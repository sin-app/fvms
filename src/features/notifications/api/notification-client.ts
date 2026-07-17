"use server";

import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function fetchNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function fetchUnreadCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const admin = createAdminClient();
  const { count } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function markAsReadAction(notificationId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
}

export async function markAllAsReadAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
}
