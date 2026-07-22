import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert({
    user_id: ctx.userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
