import { createAdminClient } from "@/lib/supabase/admin-client";
import crypto from "crypto";
import { isApiKeyRateLimited, registerApiKeyHit } from "@/lib/auth/rate-limit";

interface ApiAuthResult {
  authenticated: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
  status?: number;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// Rate limit per API key — terdistribusi via tabel `rate_limits` (lihat
// isApiKeyRateLimited/registerApiKeyHit di @/lib/auth/rate-limit). Batas:
// 300 permintaan / menit / key, konsisten lintas instance serverless.

export async function authenticateApiKey(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing API key", status: 401 };
  }

  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) {
    return { authenticated: false, error: "Invalid API key", status: 401 };
  }

  const keyHash = hashApiKey(apiKey);

  // Cek rate limit sebelum query (nama key tidak perlu diungkap).
  if (await isApiKeyRateLimited(keyHash)) {
    return { authenticated: false, error: "Too many requests", status: 429 };
  }
  await registerApiKeyHit(keyHash);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_keys")
    .select("user_id, permissions")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { authenticated: false, error: "Invalid or inactive API key", status: 401 };
  }

  // Update last_used_at
  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash);

  return {
    authenticated: true,
    userId: data.user_id,
    permissions: data.permissions,
  };
}
