import type { Kabupaten, Kecamatan, Desa } from "@/types";

export interface KabupatenWithStats extends Kabupaten {
  kecamatan_count?: number;
}

export interface KecamatanWithParent extends Kecamatan {
  kabupaten_name?: string;
  desa_count?: number;
}

export interface DesaWithParents extends Desa {
  kecamatan_name?: string;
  kabupaten_name?: string;
}

export interface MasterDataFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  is_active?: boolean;
  kabupaten_id?: string;
  kecamatan_id?: string;
}
