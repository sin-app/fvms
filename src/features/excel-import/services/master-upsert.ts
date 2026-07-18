import { createAdminClient } from "@/lib/supabase/admin-client";

type Table = "kabupaten" | "kecamatan" | "desa";

export interface MasterLookup {
  created: { kabupaten: number; kecamatan: number; desa: number };
  kabupaten: Map<string, string>;
  kecamatan: Map<string, string>;
  desa: Map<string, string>;
}

interface MasterUpsertResult {
  resolveAll: (rows: Array<{ kab: string; kec: string; desa: string }>) => Promise<MasterLookup>;
}

function generateCode(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createMasterUpserter(): MasterUpsertResult {
  const admin = createAdminClient();
  const created = { kabupaten: 0, kecamatan: 0, desa: 0 };

  async function loadExisting(
    table: Table,
    names: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (names.length === 0) return map;
    const { data } = await admin
      .from(table)
      .select("id, name")
      .in("name", names)
      .is("deleted_at", null);
    for (const row of data ?? []) map.set(row.name.toLowerCase(), row.id);
    return map;
  }

  async function createMissing(
    table: Table,
    names: string[],
    build: (name: string) => Record<string, unknown>,
  ): Promise<{ inserted: Map<string, string>; count: number }> {
    const inserted = new Map<string, string>();
    if (names.length === 0) return { inserted, count: 0 };

    const payload = names.map((name) => ({ id: crypto.randomUUID(), is_active: true, ...build(name) }));
    const { data, error } = await admin.from(table).insert(payload).select("id, name");
    if (error || !data) {
      console.error(`[master-upsert] insert ${table} failed:`, error?.message);
      return { inserted, count: 0 };
    }
    for (const row of data) inserted.set(row.name.toLowerCase(), row.id);
    return { inserted, count: data.length };
  }

  async function resolveAll(
    rows: Array<{ kab: string; kec: string; desa: string }>,
  ): Promise<MasterLookup> {
    const kabNames = Array.from(new Set(rows.map((r) => r.kab.trim()).filter(Boolean)));
    const kecNames = Array.from(new Set(rows.map((r) => r.kec.trim()).filter(Boolean)));
    const desaNames = Array.from(new Set(rows.map((r) => r.desa.trim()).filter(Boolean)));

    const kab = new Map(kabNames.map((n) => [n.toLowerCase(), ""]));
    const kec = new Map(kecNames.map((n) => [n.toLowerCase(), ""]));
    const des = new Map(desaNames.map((n) => [n.toLowerCase(), ""]));

    const kabExisting = await loadExisting("kabupaten", kabNames);
    const kecExisting = await loadExisting("kecamatan", kecNames);
    const desaExisting = await loadExisting("desa", desaNames);

    for (const [k, v] of kabExisting) kab.set(k, v);
    for (const [k, v] of kecExisting) kec.set(k, v);
    for (const [k, v] of desaExisting) des.set(k, v);

    const kabMissing = kabNames.filter((n) => !kab.get(n.toLowerCase()));
    const kecMissing = kecNames.filter((n) => !kec.get(n.toLowerCase()));
    const desaMissing = desaNames.filter((n) => !des.get(n.toLowerCase()));

    const kabNew = await createMissing("kabupaten", kabMissing, (name) => ({
      name,
      code: generateCode("KAB"),
    }));
    const kecNew = await createMissing("kecamatan", kecMissing, (name) => ({
      name,
      code: generateCode("KEC"),
      kabupaten_id: kab.get(name.toLowerCase()) || "",
    }));
    const desaNew = await createMissing("desa", desaMissing, (name) => ({
      name,
      code: generateCode("DES"),
      kecamatan_id: kec.get(name.toLowerCase()) || "",
    }));

    for (const [k, v] of kabNew.inserted) kab.set(k, v);
    for (const [k, v] of kecNew.inserted) kec.set(k, v);
    for (const [k, v] of desaNew.inserted) des.set(k, v);

    created.kabupaten += kabNew.count;
    created.kecamatan += kecNew.count;
    created.desa += desaNew.count;

    return {
      created: { ...created },
      kabupaten: kab,
      kecamatan: kec,
      desa: des,
    };
  }

  return { resolveAll };
}
