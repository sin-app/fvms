"use server";

import { getAuthContext, qcKabupatenScope } from "@/lib/auth/authorization";
import {
  getKabupatenList,
  getKecamatanList,
  getDesaList,
  getAllKabupaten,
  getAllKecamatan,
  getAllDesa,
  getAllDesaForFilter,
} from "../services/master-data-service";

export async function fetchKabupatenList(search?: string, page?: number) {
  return getKabupatenList({ search, page });
}

export async function fetchKecamatanList(kabupatenId?: string, search?: string, page?: number) {
  return getKecamatanList(kabupatenId, { search, page });
}

export async function fetchDesaList(kecamatanId?: string, search?: string, page?: number) {
  return getDesaList(kecamatanId, { search, page });
}

export async function fetchAllKabupaten() {
  const ctx = await getAuthContext();
  const result = await getAllKabupaten();

  if (ctx?.role === "qc") {
    // QC hanya melihat kabupaten tugasnya. Assignment kosong = tidak ada akses.
    const allowed = new Set(ctx.assignedKabupatenIds);
    return result.filter((k) => allowed.has(k.id));
  }

  return result;
}

export async function fetchAllKecamatan(kabupatenId: string) {
  return getAllKecamatan(kabupatenId);
}

export async function fetchAllDesa(kecamatanId: string) {
  return getAllDesa(kecamatanId);
}

export async function fetchDesaFilterOptions(kabupatenId?: string) {
  const ctx = await getAuthContext();
  const qcScope = ctx ? qcKabupatenScope(ctx) : null;

  let kabupatenIds: string[] | undefined;
  if (kabupatenId) {
    // Opsi menyempit ke kabupaten terpilih, tapi QC tidak boleh melihat desa
    // di luar wilayah tugasnya.
    kabupatenIds = qcScope !== null ? qcScope.filter((id) => id === kabupatenId) : [kabupatenId];
  } else {
    kabupatenIds = qcScope ?? undefined;
  }

  return getAllDesaForFilter(kabupatenIds && kabupatenIds.length > 0 ? kabupatenIds : undefined);
}
