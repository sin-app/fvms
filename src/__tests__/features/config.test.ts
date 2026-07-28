import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Import after setting env vars
const ORIGINAL_ENV = process.env;

describe("getConfig", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns config when all env vars are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key-456";

    const { getConfig } = await import("@/lib/config");
    const config = getConfig();

    expect(config.supabaseUrl).toBe("https://example.supabase.co");
    expect(config.supabaseAnonKey).toBe("anon-key-123");
    expect(config.supabaseServiceRoleKey).toBe("service-key-456");
  });

  it("caches the config on second call", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key-456";

    const { getConfig } = await import("@/lib/config");
    const first = getConfig();
    const second = getConfig();

    expect(first).toBe(second);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key-456";

    const { getConfig } = await import("@/lib/config");
    expect(() => getConfig()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-123";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";

    const { getConfig } = await import("@/lib/config");
    expect(() => getConfig()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });
});
