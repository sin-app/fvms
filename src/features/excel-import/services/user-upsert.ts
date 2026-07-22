import { createAdminClient } from "@/lib/supabase/admin-client";
import { createAuthUser, setPassword } from "@/features/auth/services/user-service";

interface ResolveOutput {
  map: Map<string, string>;
  created: number;
}

interface UserUpsertResult {
  resolveAll: (names: string[]) => Promise<ResolveOutput>;
}

export function createUserUpserter(): UserUpsertResult {
  const admin = createAdminClient();

  async function resolveAll(names: string[]): Promise<ResolveOutput> {
    const map = new Map<string, string>();
    const unique = Array.from(
      new Set(names.map((n) => n.trim()).filter(Boolean)),
    );
    if (unique.length === 0) return { map, created: 0 };

    const { data: existing } = await admin
      .from("users")
      .select("id, name")
      .in("name", unique);

    let created = 0;
    const toInsert: Array<{ id: string; email: string; name: string; role: string; is_active: boolean }> = [];

    const needed = new Set(unique.map((n) => n.toLowerCase()));
    for (const row of existing ?? []) {
      map.set(row.name.toLowerCase(), row.id);
      needed.delete(row.name.toLowerCase());
    }

    for (const lowerName of needed) {
      const original = unique.find((n) => n.toLowerCase() === lowerName) ?? lowerName;
      const slug = lowerName
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40);
      toInsert.push({
        id: crypto.randomUUID(),
        email: `${slug}@fvms.com`,
        name: original,
        role: "produksi",
        is_active: true,
      });
    }

    if (toInsert.length > 0) {
      const { error } = await admin.from("users").insert(toInsert);
      if (!error) {
        created = toInsert.length;
        // Create auth accounts so petugas can log in (password set later by admin).
        for (const row of toInsert) {
          try {
            await createAuthUser({
              id: row.id,
              email: row.email,
              name: row.name,
              role: "produksi",
              // Auto-set password to the user's email on import.
              password: row.email,
            });
          } catch {
            // Account may already exist (re-import): ensure password = email.
            try {
              await setPassword(row.id, row.email);
            } catch {
              // ignore
            }
          }
        }
      }
      // Re-fetch to capture any rows that already existed (race / prior import).
      const { data: after } = await admin
        .from("users")
        .select("id, name")
        .in("name", unique);
      for (const row of after ?? []) map.set(row.name.toLowerCase(), row.id);
    }

    return { map, created };
  }

  return { resolveAll };
}
