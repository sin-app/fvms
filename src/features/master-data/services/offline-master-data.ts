import { getOfflineDb, type OfflineRegion } from "@/lib/offline/db";
import type { Kabupaten, Kecamatan, Desa } from "@/types";

function byParent(regions: OfflineRegion[], entity: OfflineRegion["entity"], parentId: string | null) {
  return regions
    .filter((r) => r.entity === entity && r.parent_id === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/** Kabupaten dari IndexedDB (kolom lain tidak disimpan lokal). */
export async function loadOfflineKabupaten(): Promise<Kabupaten[]> {
  const regions = await getOfflineDb().regions.toArray();
  return byParent(regions, "kabupaten", null).map(
    (r) =>
      ({
        id: r.id,
        name: r.name,
        code: "",
        is_active: true,
        created_at: "",
        updated_at: "",
        deleted_at: null,
      }) as Kabupaten,
  );
}

/** Kecamatan milik kabupaten dari IndexedDB. */
export async function loadOfflineKecamatan(kabupatenId: string): Promise<Kecamatan[]> {
  const regions = await getOfflineDb().regions.toArray();
  return byParent(regions, "kecamatan", kabupatenId).map(
    (r) =>
      ({
        id: r.id,
        kabupaten_id: kabupatenId,
        name: r.name,
        code: "",
        is_active: true,
        created_at: "",
        updated_at: "",
        deleted_at: null,
      }) as Kecamatan,
  );
}

/** Opsi desa untuk dropdown filter — opsional dibatasi kabupaten. */
export async function loadOfflineDesaOptions(kabupatenId?: string): Promise<Desa[]> {
  const regions = await getOfflineDb().regions.toArray();
  let kecamatanIds: Set<string> | null = null;
  if (kabupatenId) {
    kecamatanIds = new Set(
      byParent(regions, "kecamatan", kabupatenId).map((r) => r.id),
    );
  }
  return byParent(regions, "desa", null)
    .filter((r) => (kecamatanIds ? kecamatanIds.has(r.parent_id ?? "") : true))
    .map((r) => ({
      id: r.id,
      kecamatan_id: r.parent_id ?? "",
      name: r.name,
      code: "",
      is_active: true,
      created_at: "",
      updated_at: "",
      deleted_at: null,
    }) as Desa);
}
