import { createAdminClient } from "@/lib/supabase/admin-client";

const DEFAULT_PASSWORD = "Fvms@2024";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface UserUpsertResult {
  created: number;
  resolve: (name: string) => Promise<string | null>;
}

export function createUserUpserter(): UserUpsertResult {
  const admin = createAdminClient();
  const cache = new Map<string, string>();
  let created = 0;

  async function resolve(name: string): Promise<string | null> {
    const key = name.trim().toLowerCase();
    if (cache.has(key)) return cache.get(key)!;

    const { data: existing } = await admin
      .from("users")
      .select("id, name")
      .eq("name", name.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      cache.set(key, existing.id);
      return existing.id;
    }

    const email = `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}@fvms.local`;

    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name: name.trim(), role: "field_officer" },
        app_metadata: { role: "field_officer" },
      });

    if (authError || !authUser.user) return null;

    const { error: dbError } = await admin.from("users").insert({
      id: authUser.user.id,
      email,
      name: name.trim(),
      role: "field_officer",
      is_active: true,
    });

    if (dbError) return null;

    created += 1;
    cache.set(key, authUser.user.id);
    return authUser.user.id;
  }

  return { created, resolve };
}
