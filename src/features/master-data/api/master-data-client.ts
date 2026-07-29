"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";
import {
  getKabupatenList,
  getKecamatanList,
  getDesaList,
  getAllKabupaten,
  getAllKecamatan,
  getAllDesa,
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

  if (ctx?.role === "qc" && ctx.assignedKabupatenIds.length > 0) {
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
