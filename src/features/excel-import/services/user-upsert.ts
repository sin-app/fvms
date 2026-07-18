import { createAdminClient } from "@/lib/supabase/admin-client";

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
      .in("name", unique)
      .is("deleted_at", null);

    let created = 0;
    const toInsert: Array<{ id: string; email: string; name: string; role: string; is_active: boolean }> = [];

    const needed = new Set(unique.map((n) => n.toLowerCase()));
    for (const row of existing ?? []) {
      map.set(row.name.toLowerCase(), row.id);
      needed.delete(row.name.toLowerCase());
    }

    for (const name of needed) {
      const id = crypto.randomUUID();
      toInsert.push({
        id,
        email: `${name.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id.slice(0, 6)}@fvms.local`,
        name,
        role: "field_officer",
        is_active: true,
      });
    }

    if (toInsert.length > 0) {
      const { error } = await admin.from("users").insert(toInsert);
      if (!error) {
        created = toInsert.length;
        for (const u of toInsert) map.set(u.name.toLowerCase(), u.id);
      }
    }

    return { map, created };
  }

  return { resolveAll };
}
