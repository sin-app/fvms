import { createAdminClient } from "@/lib/supabase/admin-client";
import { logger } from "@/lib/logger";

export interface MasterLookup {
  created: { kabupaten: number; kecamatan: number; desa: number };
  kabupaten: Map<string, string>;
  kecamatan: Map<string, string>;
  desa: Map<string, string>;
}

interface MasterUpsertResult {
  resolveAll: (rows: Array<{ kab: string; kec: string; desa: string }>) => Promise<MasterLookup>;
}

function shortCode(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 4)}`;
}

export function createMasterUpserter(): MasterUpsertResult {
  const admin = createAdminClient();
  const created = { kabupaten: 0, kecamatan: 0, desa: 0 };

  async function loadExisting(
    table: "kabupaten" | "kecamatan" | "desa",
    names: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (names.length === 0) return map;
    const { data } = await admin
      .from(table)
      .select("id, name")
      .in("name", names);
    for (const row of data ?? []) map.set(row.name.toLowerCase(), row.id);
    return map;
  }

  async function insertRows(
    table: "kabupaten" | "kecamatan" | "desa",
    payload: Array<Record<string, unknown>>,
    names: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (payload.length === 0) return map;
    const { data, error } = await admin.from(table).insert(payload).select("id, name");
    if (error) {
      logger.error("master-upsert: insert failed", { table, error: error?.message });
    }
    for (const row of data ?? []) map.set(row.name.toLowerCase(), row.id);
    // Re-fetch to capture rows that already existed or were just inserted.
    if (names.length > 0) {
      const { data: after } = await admin
        .from(table)
        .select("id, name")
        .in("name", names);
      for (const row of after ?? []) map.set(row.name.toLowerCase(), row.id);
      created[table] += data?.length ?? 0;
    }
    return map;
  }

  async function resolveAll(
    rows: Array<{ kab: string; kec: string; desa: string }>,
  ): Promise<MasterLookup> {
    const kab = new Map<string, string>();
    const kec = new Map<string, string>();
    const des = new Map<string, string>();

    const kabNames = Array.from(new Set(rows.map((r) => r.kab.trim()).filter(Boolean)));
    const kecNames = Array.from(new Set(rows.map((r) => r.kec.trim()).filter(Boolean)));
    const desaNames = Array.from(new Set(rows.map((r) => r.desa.trim()).filter(Boolean)));

    const kabExisting = await loadExisting("kabupaten", kabNames);
    for (const [k, v] of kabExisting) kab.set(k, v);
    const kecExisting = await loadExisting("kecamatan", kecNames);
    for (const [k, v] of kecExisting) kec.set(k, v);
    const desaExisting = await loadExisting("desa", desaNames);
    for (const [k, v] of desaExisting) des.set(k, v);

    const kabMissing = kabNames.filter((n) => !kab.get(n.toLowerCase()));
    const kabPayload = kabMissing.map((name) => ({
      id: crypto.randomUUID(),
      name,
      code: shortCode("KAB"),
      is_active: true,
    }));
    const kabNew = await insertRows("kabupaten", kabPayload, kabMissing);
    for (const [k, v] of kabNew) kab.set(k, v);

    // Kecamatan: parent = kabupaten id (resolved from the row's kabupaten).
    const kecPayload: Array<Record<string, unknown>> = [];
    const seenKec = new Set<string>();
    for (const r of rows) {
      const kecKey = r.kec.trim().toLowerCase();
      const kabId = kab.get(r.kab.trim().toLowerCase());
      if (kabId && !kec.get(kecKey) && !seenKec.has(kecKey)) {
        seenKec.add(kecKey);
        kecPayload.push({
          id: crypto.randomUUID(),
          name: r.kec.trim(),
          code: shortCode("KEC"),
          is_active: true,
          kabupaten_id: kabId,
        });
      }
    }
    const kecNew = await insertRows("kecamatan", kecPayload, kecNames);
    for (const [k, v] of kecNew) kec.set(k, v);

    // Desa: parent = kecamatan id (now resolved above).
    const desaPayload: Array<Record<string, unknown>> = [];
    const seenDesa = new Set<string>();
    for (const r of rows) {
      const desaKey = r.desa.trim().toLowerCase();
      const kecId = kec.get(r.kec.trim().toLowerCase());
      if (kecId && !des.get(desaKey) && !seenDesa.has(desaKey)) {
        seenDesa.add(desaKey);
        desaPayload.push({
          id: crypto.randomUUID(),
          name: r.desa.trim(),
          code: shortCode("DES"),
          is_active: true,
          kecamatan_id: kecId,
        });
      }
    }
    const desaNew = await insertRows("desa", desaPayload, desaNames);
    for (const [k, v] of desaNew) des.set(k, v);

    return { created: { ...created }, kabupaten: kab, kecamatan: kec, desa: des };
  }

  return { resolveAll };
}
