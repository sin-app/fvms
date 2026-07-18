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
      .in("name", unique);

    let created = 0;
    const toInsert: Array<{ id: string; email: string; name: string; role: string; is_active: boolean }> = [];

    const needed = new Set(unique.map((n) => n.toLowerCase()));
    for (const row of existing ?? []) {
      map.set(row.name.toLowerCase(), row.id);
      needed.delete(row.name.toLowerCase());
    }

    for (const name of needed) {
      const slug = name
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40);
      toInsert.push({
        id: crypto.randomUUID(),
        email: `${slug}@fvms.com`,
        name,
        role: "field_officer",
        is_active: true,
      });
    }

    if (toInsert.length > 0) {
      const { error } = await admin.from("users").insert(toInsert);
      if (!error) created = toInsert.length;
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
