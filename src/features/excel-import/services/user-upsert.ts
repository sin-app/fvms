import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createAuthUser, setPassword, randomPassword } from "@/features/auth/services/user-service";
import { logger } from "@/lib/logger";

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
      .in("role", ["produksi", "qc", "admin"])
      .limit(2000);

    let created = 0;
    const toInsert: Array<{ id: string; email: string; name: string; role: string; is_active: boolean }> = [];

    const needed = new Set(unique.map((n) => n.toLowerCase()));
    for (const row of existing ?? []) {
      map.set(row.name.toLowerCase(), row.id);
      needed.delete(row.name.toLowerCase());
    }

    const usedEmails = new Set<string>();
    for (const lowerName of needed) {
      const original = unique.find((n) => n.toLowerCase() === lowerName) ?? lowerName;
      let slug = lowerName
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40);
      if (!slug) slug = "user";
      // Handle slug collision: "john-doe" vs "John Doe"
      let email = `${slug}@fvms.com`;
      let counter = 2;
      while (usedEmails.has(email)) {
        const suffix = String(counter).padStart(2, "0");
        const truncated = slug.slice(0, 38 - suffix.length);
        email = `${truncated}-${suffix}@fvms.com`;
        counter++;
      }
      usedEmails.add(email);
      toInsert.push({
        id: crypto.randomUUID(),
        email,
        name: original,
        role: "produksi",
        is_active: true,
      });
    }

    const authErrors: string[] = [];
    if (toInsert.length > 0) {
      const { error } = await admin.from("users").insert(toInsert);
      if (!error) {
        created = toInsert.length;
        for (const row of toInsert) {
          try {
            await createAuthUser({
              id: row.id,
              email: row.email,
              name: row.name,
              role: "produksi",
              password: randomPassword(),
            });
          } catch {
            try {
              await setPassword(row.id, randomPassword());
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              authErrors.push(`${row.email}: ${msg}`);
            }
          }
        }
      }
      const { data: after } = await admin
        .from("users")
        .select("id, name")
        .in("role", ["produksi", "qc", "admin"])
        .limit(2000);
      for (const row of after ?? []) map.set(row.name.toLowerCase(), row.id);
    }

    if (authErrors.length > 0) {
      logger.error("[user-upsert] Auth account errors", { errors: authErrors.join("; ") });
    }

    return { map, created };
  }

  return { resolveAll };
}
