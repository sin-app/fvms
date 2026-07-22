import { createAdminClient } from "@/lib/supabase/admin-client";
import type { Kabupaten, Kecamatan, Desa } from "@/types";
import type { MasterDataFilters } from "../types";

const ITEMS_PER_PAGE = 20;

export async function getKabupatenList(filters: MasterDataFilters = {}) {
  const admin = createAdminClient();
  const { search, page = 1, pageSize = ITEMS_PER_PAGE } = filters;

  let query = admin
    .from("kabupaten")
    .select("*, kecamatan_count:kecamatan(count)", { count: "exact" })
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as unknown as Kabupaten[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getKecamatanList(kabupatenId?: string, filters: MasterDataFilters = {}) {
  const admin = createAdminClient();
  const { search, page = 1, pageSize = ITEMS_PER_PAGE } = filters;

  let query = admin
    .from("kecamatan")
    .select("*, kabupaten!inner(name), desa_count:desa(count)", { count: "exact" })
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (kabupatenId) {
    query = query.eq("kabupaten_id", kabupatenId);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as unknown as Kecamatan[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getDesaList(kecamatanId?: string, filters: MasterDataFilters = {}) {
  const admin = createAdminClient();
  const { search, page = 1, pageSize = ITEMS_PER_PAGE } = filters;

  let query = admin
    .from("desa")
    .select("*, kecamatan!inner(name, kabupaten_id, kabupaten(name))", { count: "exact" })
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (kecamatanId) {
    query = query.eq("kecamatan_id", kecamatanId);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as unknown as Desa[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getAllKabupaten() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("kabupaten")
    .select("id, name, code")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("name");

  return data || [];
}

export async function getAllKecamatan(kabupatenId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("kecamatan")
    .select("id, name, code")
    .is("deleted_at", null)
    .eq("kabupaten_id", kabupatenId)
    .eq("is_active", true)
    .order("name");

  return data || [];
}

export async function getAllDesa(kecamatanId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("desa")
    .select("id, name, code")
    .is("deleted_at", null)
    .eq("kecamatan_id", kecamatanId)
    .eq("is_active", true)
    .order("name");

  return data || [];
}

export async function createKabupaten(data: { name: string; code: string }) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("kabupaten")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateKabupaten(id: string, data: { name: string; code: string; is_active: boolean }) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("kabupaten")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteKabupaten(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("kabupaten")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function createKecamatan(data: { kabupaten_id: string; name: string; code: string }) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("kecamatan")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateKecamatan(id: string, data: { kabupaten_id: string; name: string; code: string; is_active: boolean }) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("kecamatan")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteKecamatan(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("kecamatan")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function createDesa(data: { kecamatan_id: string; name: string; code: string }) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("desa")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateDesa(id: string, data: { kecamatan_id: string; name: string; code: string; is_active: boolean }) {
  const admin = createAdminClient();
  const { data: result, error } = await admin
    .from("desa")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteDesa(id: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("desa")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
