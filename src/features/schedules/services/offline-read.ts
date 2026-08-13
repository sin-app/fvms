import { getOfflineDb, type OfflineScheduleRow } from "@/lib/offline/db";
import { getPanenStatus } from "@/features/panen/services/panen-logic";
import { getVarietasFromDocumentNo } from "@/lib/utils/varietas";
import type { Schedule, Kabupaten, Kecamatan, Desa, User } from "@/types";
import type { ScheduleFilters } from "../types";

export type OfflineSchedule = Schedule & { varietas: string | null };

export function offlineRowToSchedule(row: OfflineScheduleRow): OfflineSchedule {
  const { kabupaten_name, kecamatan_name, desa_name, user_name, ...rest } = row;
  return {
    ...(rest as unknown as OfflineSchedule),
    varietas: row.varietas ?? getVarietasFromDocumentNo(row.document_no),
    ...(kabupaten_name ? { kabupaten: { name: kabupaten_name } as Kabupaten } : {}),
    ...(kecamatan_name ? { kecamatan: { name: kecamatan_name } as Kecamatan } : {}),
    ...(desa_name ? { desa: { name: desa_name } as Desa } : {}),
    ...(user_name ? { users: { name: user_name } as User } : {}),
  };
}

const like = (value: string | null | undefined, term?: string) =>
  !term || (value ?? "").toLowerCase().includes(term.toLowerCase());

export function filterOfflineSchedules(rows: OfflineSchedule[], filters: ScheduleFilters): OfflineSchedule[] {
  return rows.filter((s) => {
    if (filters.includeDeleted === true) {
      if (!s.deleted_at) return false;
    } else if (s.deleted_at) {
      return false;
    }
    if (filters.status && s.status !== filters.status) return false;
    if (filters.label && s.label !== filters.label) return false;
    if (filters.user_id && s.user_id !== filters.user_id) return false;
    if (filters.kabupaten_id && s.kabupaten_id !== filters.kabupaten_id) return false;
    if (filters.kecamatan_id && s.kecamatan_id !== filters.kecamatan_id) return false;
    if (filters.desa_id && s.desa_id !== filters.desa_id) return false;
    if (filters.date_from && s.visit_date < filters.date_from) return false;
    if (filters.date_to && s.visit_date > filters.date_to) return false;
    if (!like(s.member_name, filters.member_name)) return false;
    // varietas bukan kolom DB: diambil dari segmen kedua document_no (mis. "KJM/JMP-18/...").
    if (!like(getVarietasFromDocumentNo(s.document_no), filters.varietas)) return false;
    if (filters.cgr && s.cgr !== filters.cgr) return false;
    if (filters.block_no?.length && !filters.block_no.includes(s.block_no ?? "")) return false;
    if (filters.no_plot && s.no_plot !== filters.no_plot) return false;
    if (filters.nis && s.nis !== filters.nis) return false;
    if (filters.document_no && s.document_no !== filters.document_no) return false;
    if (filters.panen_status && filters.panen_status !== "all") {
      const panen = getPanenStatus(s);
      const label = panen.harvested ? "panen" : panen.label === "Jatuh Tempo" ? "jatuh_tempo" : panen.label.startsWith("Renc") ? "rencana" : "none";
      if (label !== filters.panen_status) return false;
    }
    return true;
  });
}

export function loadOfflineScheduleRows(filters: ScheduleFilters): Promise<OfflineSchedule[]> {
  return getOfflineDb()
    .schedules.toArray()
    .then((rows) =>
      filterOfflineSchedules(rows.map(offlineRowToSchedule), filters).sort((a, b) =>
        a.visit_date.localeCompare(b.visit_date),
      ),
    );
}

/** Petugas unik (dari jadwal tersimpan) untuk dropdown filter — fallback luring. */
export async function loadOfflineOfficers(kabupatenId?: string): Promise<import("@/types").User[]> {
  const rows = await getOfflineDb().schedules.toArray();
  const scoped = kabupatenId ? rows.filter((r) => r.kabupaten_id === kabupatenId) : rows;
  const map = new Map<string, string>();
  for (const r of scoped) {
    if (r.user_id && r.user_name) map.set(r.user_id, r.user_name);
  }
  return Array.from(map.entries()).map(([id, name]) => ({
    id,
    email: "",
    name,
    role: "produksi",
    avatar_url: null,
    phone: null,
    is_active: true,
    assigned_kabupaten_ids: [],
    last_login_at: null,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  }) as import("@/types").User);
}

export const OFFLINE_DISTINCT_FIELDS = ["block_no", "no_plot", "nis", "document_no", "cgr"] as const;
export type OfflineDistinctField = (typeof OFFLINE_DISTINCT_FIELDS)[number];

/** Nilai unik per kolom (ala Excel) dari IndexedDB — mirror getDistinctScheduleValues. */
export function loadOfflineDistinctValues(
  activeFilters?: import("../types").DistinctFiltersInput,
): Promise<Record<OfflineDistinctField, string[]>> {
  const eqVal = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  const filters = activeFilters ?? {};

  const matches = (s: import("@/lib/offline/db").OfflineScheduleRow, selfField: OfflineDistinctField): boolean => {
    if (selfField !== "block_no" && filters.block_no?.length) {
      if (!filters.block_no.includes(s.block_no ?? "")) return false;
    }
    const noPlot = eqVal(filters.no_plot);
    if (selfField !== "no_plot" && noPlot && s.no_plot !== noPlot) return false;
    const nis = eqVal(filters.nis);
    if (selfField !== "nis" && nis && s.nis !== nis) return false;
    const doc = eqVal(filters.document_no);
    if (selfField !== "document_no" && doc && s.document_no !== doc) return false;
    const cgr = eqVal(filters.cgr);
    if (selfField !== "cgr" && cgr && s.cgr !== cgr) return false;
    const kab = eqVal(filters.kabupaten_id);
    if (kab && s.kabupaten_id !== kab) return false;
    const kec = eqVal(filters.kecamatan_id);
    if (kec && s.kecamatan_id !== kec) return false;
    const desa = eqVal(filters.desa_id);
    if (desa && s.desa_id !== desa) return false;
    if (filters.member_name?.trim() && !like(s.member_name, filters.member_name.trim())) return false;
    if (filters.varietas?.trim() && !(s.document_no ?? "").includes(`/${filters.varietas.trim()}/`)) return false;
    return true;
  };

  return getOfflineDb()
    .schedules.toArray()
    .then((rows) => {
      const result = {} as Record<OfflineDistinctField, string[]>;
      for (const field of OFFLINE_DISTINCT_FIELDS) {
        const values = rows.filter((r) => matches(r, field)).map((r) => r[field]);
        result[field] = Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true }),
        );
      }
      return result;
    });
}