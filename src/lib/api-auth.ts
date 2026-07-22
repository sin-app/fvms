import { createAdminClient } from "@/lib/supabase/admin-client";

interface ApiAuthResult {
  authenticated: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
  status?: number;
}

export async function authenticateApiKey(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing API key", status: 401 };
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return { authenticated: false, error: "Invalid API key", status: 401 };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_keys")
    .select("user_id, permissions")
    .eq("key", apiKey)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { authenticated: false, error: "Invalid or inactive API key", status: 401 };
  }

  // Update last_used_at
  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key", apiKey);

  return {
    authenticated: true,
    userId: data.user_id,
    permissions: data.permissions,
  };
}
