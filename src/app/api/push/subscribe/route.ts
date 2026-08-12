import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z
    .object({
      p256dh: z.string().min(16).max(512),
      auth: z.string().min(16).max(512),
    })
    .strict(),
});

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert({
    user_id: ctx.userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return Response.json({ error: "Gagal menyimpan subscription" }, { status: 500 });

  return Response.json({ success: true });
}
