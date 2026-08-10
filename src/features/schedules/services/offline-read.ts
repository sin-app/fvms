import { getOfflineDb, type OfflineScheduleRow } from "@/lib/offline/db";
import { getPanenStatus } from "@/features/panen/services/panen-logic";
import type { Schedule, Kabupaten, Kecamatan, Desa, User } from "@/types";
import type { ScheduleFilters } from "../types";

export type OfflineSchedule = Schedule & { varietas: string | null };

export function offlineRowToSchedule(row: OfflineScheduleRow): OfflineSchedule {
  const { kabupaten_name, kecamatan_name, desa_name, user_name, ...rest } = row;
  return {
    ...(rest as unknown as OfflineSchedule),
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
    if (filters.status && s.status !== filters.status) return false;
    if (filters.label && s.label !== filters.label) return false;
    if (filters.user_id && s.user_id !== filters.user_id) return false;
    if (filters.kabupaten_id && s.kabupaten_id !== filters.kabupaten_id) return false;
    if (filters.kecamatan_id && s.kecamatan_id !== filters.kecamatan_id) return false;
    if (filters.desa_id && s.desa_id !== filters.desa_id) return false;
    if (filters.date_from && s.visit_date < filters.date_from) return false;
    if (filters.date_to && s.visit_date > filters.date_to) return false;
    if (!like(s.member_name, filters.member_name)) return false;
    if (!like(s.varietas, filters.varietas)) return false;
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