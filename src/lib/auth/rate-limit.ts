import { createAdminClient } from "@/lib/supabase/admin-client";
import { logger } from "@/lib/logger";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

interface RateLimitRow {
  key: string;
  count: number;
  first_at: string;
  blocked_until: string;
}

function keyFor(namespace: string, email: string, ip: string | null): string {
  return `${namespace}:${ip ?? "unknown"}:${email.toLowerCase()}`;
}

// In-memory fallback used when the rate_limits table is unavailable
// (e.g. before migration applied, or transient DB error). Persists only
// within a single serverless invocation — better than nothing for dev.
const memoryStore = new Map<string, RateLimitRow>();

async function readRow(key: string): Promise<RateLimitRow | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("rate_limits")
      .select("key, count, first_at, blocked_until")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return (data as RateLimitRow | null) ?? null;
  } catch (err) {
    logger.warn("rate-limit read failed, using memory fallback", {
      key,
      error: String(err),
    });
    return memoryStore.get(key) ?? null;
  }
}

async function writeRow(row: RateLimitRow): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("rate_limits").upsert(row, { onConflict: "key" });
    if (error) throw error;
  } catch (err) {
    logger.warn("rate-limit write failed, using memory fallback", {
      key: row.key,
      error: String(err),
    });
    memoryStore.set(row.key, row);
  }
}

export function isLoginRateLimited(email: string, ip: string | null): boolean {
  return isRateLimited("login", email, ip);
}

export function registerLoginFailure(email: string, ip: string | null): void {
  registerFailure("login", email, ip);
}

export function registerLoginSuccess(email: string, ip: string | null): void {
  void deleteKey(keyFor("login", email, ip));
}

export function isEmailRateLimited(namespace: string, email: string, ip: string | null): boolean {
  return isRateLimited(namespace, email, ip);
}

export function registerEmailFailure(namespace: string, email: string, ip: string | null): void {
  registerFailure(namespace, email, ip);
}

export function isIpRateLimited(namespace: string, ip: string | null): boolean {
  return isRateLimited(namespace, "__ip__", ip);
}

export function registerIpFailure(namespace: string, ip: string | null): void {
  registerFailure(namespace, "__ip__", ip);
}

function isRateLimited(namespace: string, email: string, ip: string | null): boolean {
  const key = keyFor(namespace, email, ip);
  const now = Date.now();
  const row = readRowSync(key);
  if (!row) return false;
  if (now < new Date(row.blocked_until).getTime()) return true;
  if (now - new Date(row.first_at).getTime() > WINDOW_MS) {
    void deleteKey(key);
    return false;
  }
  return row.count >= MAX_ATTEMPTS;
}

function registerFailure(namespace: string, email: string, ip: string | null): void {
  const key = keyFor(namespace, email, ip);
  const now = Date.now();
  const existing = readRowSync(key);

  if (!existing || now - new Date(existing.first_at).getTime() > WINDOW_MS) {
    void writeRow({
      key,
      count: 1,
      first_at: new Date(now).toISOString(),
      blocked_until: new Date(0).toISOString(),
    });
    return;
  }

  const count = existing.count + 1;
  const blockedUntil =
    count >= MAX_ATTEMPTS ? new Date(now + BLOCK_MS).toISOString() : existing.blocked_until;
  void writeRow({
    key,
    count,
    first_at: existing.first_at,
    blocked_until: blockedUntil,
  });
}

// Synchronous bridge: read current best-known state (memory cache first, then DB).
function readRowSync(key: string): RateLimitRow | null {
  if (memoryStore.has(key)) return memoryStore.get(key) ?? null;
  // Kick an async refresh but return current memory value (may be null first pass).
  void readRow(key).then((row) => {
    if (row) memoryStore.set(key, row);
  });
  return memoryStore.get(key) ?? null;
}

async function deleteKey(key: string): Promise<void> {
  memoryStore.delete(key);
  try {
    const admin = createAdminClient();
    await admin.from("rate_limits").delete().eq("key", key);
  } catch (err) {
    logger.warn("rate-limit delete failed", { key, error: String(err) });
  }
}
