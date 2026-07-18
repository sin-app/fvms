import { createAdminClient } from "@/lib/supabase/admin-client";

function generateCode(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

async function findByName(
  table: "kabupaten" | "kecamatan" | "desa",
  name: string,
  extra?: { column: string; value: string },
): Promise<string | null> {
  const admin = createAdminClient();
  let query = admin.from(table).select("id").eq("name", name).is("deleted_at", null);
  if (extra) query = query.eq(extra.column, extra.value);
  const { data } = await query.maybeSingle();
  return data?.id ?? null;
}

interface UpsertResult {
  created: { kabupaten: number; kecamatan: number; desa: number };
  resolve: (
    kabName: string,
    kecName: string,
    desaName: string,
  ) => Promise<{ kabupaten_id: string; kecamatan_id: string; desa_id: string } | null>;
}

export function createMasterUpserter(): UpsertResult {
  const admin = createAdminClient();
  const created = { kabupaten: 0, kecamatan: 0, desa: 0 };
  const kabCache = new Map<string, string>();
  const kecCache = new Map<string, string>();
  const desaCache = new Map<string, string>();

  async function ensureKabupaten(name: string): Promise<string | null> {
    const key = name.toLowerCase();
    if (kabCache.has(key)) return kabCache.get(key)!;

    const existing = await findByName("kabupaten", name);
    if (existing) {
      kabCache.set(key, existing);
      return existing;
    }

    const { data, error } = await admin
      .from("kabupaten")
      .insert({ name, code: generateCode("KAB") })
      .select("id")
      .single();
    if (error || !data) return null;

    created.kabupaten += 1;
    kabCache.set(key, data.id);
    return data.id;
  }

  async function ensureKecamatan(name: string, kabupatenId: string): Promise<string | null> {
    const key = `${kabupatenId}:${name.toLowerCase()}`;
    if (kecCache.has(key)) return kecCache.get(key)!;

    const existing = await findByName("kecamatan", name, {
      column: "kabupaten_id",
      value: kabupatenId,
    });
    if (existing) {
      kecCache.set(key, existing);
      return existing;
    }

    const { data, error } = await admin
      .from("kecamatan")
      .insert({ name, kabupaten_id: kabupatenId, code: generateCode("KEC") })
      .select("id")
      .single();
    if (error || !data) return null;

    created.kecamatan += 1;
    kecCache.set(key, data.id);
    return data.id;
  }

  async function ensureDesa(name: string, kecamatanId: string): Promise<string | null> {
    const key = `${kecamatanId}:${name.toLowerCase()}`;
    if (desaCache.has(key)) return desaCache.get(key)!;

    const existing = await findByName("desa", name, {
      column: "kecamatan_id",
      value: kecamatanId,
    });
    if (existing) {
      desaCache.set(key, existing);
      return existing;
    }

    const { data, error } = await admin
      .from("desa")
      .insert({ name, kecamatan_id: kecamatanId, code: generateCode("DES") })
      .select("id")
      .single();
    if (error || !data) return null;

    created.desa += 1;
    desaCache.set(key, data.id);
    return data.id;
  }

  return {
    created,
    resolve: async (kabName, kecName, desaName) => {
      const kabupaten_id = await ensureKabupaten(kabName);
      if (!kabupaten_id) return null;
      const kecamatan_id = await ensureKecamatan(kecName, kabupaten_id);
      if (!kecamatan_id) return null;
      const desa_id = await ensureDesa(desaName, kecamatan_id);
      if (!desa_id) return null;
      return { kabupaten_id, kecamatan_id, desa_id };
    },
  };
}
