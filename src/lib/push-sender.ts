import { createAdminClient } from "@/lib/supabase/admin-client";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotifications(payload: PushPayload): Promise<number> {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (!subs || subs.length === 0) return 0;

  const webpush = await import("web-push");
  webpush.setVapidDetails(
    VAPID_SUBJECT ?? "mailto:admin@fvms.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch {
      // Invalid subscription — could delete here
    }
  }
  return sent;
}
