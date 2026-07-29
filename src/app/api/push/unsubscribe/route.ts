import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";

export async function POST() {
  const ctx = await getAuthContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").delete().eq("user_id", ctx.userId);

  if (error) return Response.json({ error: "Gagal menghapus subscription" }, { status: 500 });

  return Response.json({ success: true });
}
