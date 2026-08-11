import { getOfflineDb } from "@/lib/offline/db";
import { deriveScheduleStatus, getPanenStatus } from "@/features/panen/services/panen-logic";
import { todayString } from "@/lib/utils/date";
import { getVarietasFromDocumentNo } from "@/lib/utils/varietas";
import type { ReportFilters, ReportData } from "../types";
import type { ReportRow } from "../types/report-data";

const like = (value: string | null | undefined, term?: string) =>
  !term || (value ?? "").toLowerCase().includes(term.toLowerCase());

/** Baris laporan dari IndexedDB — mirror getReportRows (server). */
export async function loadOfflineReportRows(filters: ReportFilters): Promise<ReportRow[]> {
  const rows = await getOfflineDb().schedules.toArray();
  const filtered = rows.filter((s) => {
    if (filters.date_from && s.visit_date < filters.date_from) return false;
    if (filters.date_to && s.visit_date > filters.date_to) return false;
    if (filters.kabupaten_id && s.kabupaten_id !== filters.kabupaten_id) return false;
    if (filters.kecamatan_id && s.kecamatan_id !== filters.kecamatan_id) return false;
    if (filters.desa_id && s.desa_id !== filters.desa_id) return false;
    if (filters.label) {
      if (filters.label === "ada") {
        if (!s.label) return false;
      } else if (s.label !== filters.label) {
        return false;
      }
    }
    if (!like(s.member_name, filters.member_name)) return false;
    if (filters.block_no?.length && !filters.block_no.includes(s.block_no ?? "")) return false;
    if (filters.no_plot && s.no_plot !== filters.no_plot) return false;
    if (filters.nis && s.nis !== filters.nis) return false;
    if (filters.document_no && s.document_no !== filters.document_no) return false;
    if (filters.cgr && s.cgr !== filters.cgr) return false;
    if (filters.varietas) {
      if (!(s.document_no ?? "").includes(`/${filters.varietas}/`)) return false;
    }
    return true;
  });

  const now = todayString();

  return filtered
    .map((s) => {
      const ps = getPanenStatus({
        tgl_panen: s.tgl_panen,
        real_panen: s.real_panen,
        rencana_panen: s.rencana_panen,
        tgl_tanam: s.tgl_tanam,
        cgr: s.cgr,
      });
      const hasActivity = s.visit_time != null || s.notes != null || s.latitude != null;
      const derived = deriveScheduleStatus({
        real_tanam_ha: toNumberOrNull(s.real_tanam_ha),
        gagal_tanam: toNumberOrNull(s.gagal_tanam),
        sisa_di_lahan_ha: toNumberOrNull(s.sisa_di_lahan_ha),
        hasActivity,
      });
      const status = derived ? derived.status : s.status;
      return {
        id: s.id,
        visit_date: s.visit_date,
        user_name: s.user_name ?? "—",
        kabupaten_name: s.kabupaten_name ?? "—",
        kecamatan_name: s.kecamatan_name ?? "—",
        desa_name: s.desa_name ?? "—",
        status,
        visit_time: s.visit_time,
        has_notes: s.notes != null && s.notes.length > 0,
        rencana_panen: s.rencana_panen ?? null,
        real_panen: s.real_panen ?? null,
        tgl_panen: s.tgl_panen ?? null,
        label: s.label ?? null,
        member_name: s.member_name ?? null,
        block_no: s.block_no ?? null,
        no_plot: s.no_plot ?? null,
        nis: s.nis ?? null,
        cgr: s.cgr ?? null,
        varietas: getVarietasFromDocumentNo(s.document_no),
        document_no: s.document_no ?? null,
        panen_status: ps.label,
        ph_tanah: toNumberOrNull(s.ph_tanah),
        tgl_tanam: s.tgl_tanam ?? null,
        real_tanam_ha: toNumberOrNull(s.real_tanam_ha),
        gagal_tanam: toNumberOrNull(s.gagal_tanam),
        sisa_di_lahan_ha: toNumberOrNull(s.sisa_di_lahan_ha),
        detaseling: s.detaseling ?? null,
      } satisfies ReportRow;
    })
    .filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (filters.panen_status && filters.panen_status !== "all") {
        const p = filters.panen_status;
        if (p === "sudah") return r.panen_status === "Panen";
        if (p === "jatuh_tempo") return r.panen_status === "Jatuh Tempo";
        if (p === "belum") return r.panen_status !== "Panen" && r.panen_status !== "Jatuh Tempo";
      }
      return true;
    })
    .sort((a, b) => a.visit_date.localeCompare(b.visit_date));
}

function toNumberOrNull(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Agregasi laporan dari baris lokal — mirror getReportData (server). */
export function buildOfflineReportData(rows: ReportRow[]): ReportData {
  const total = rows.length;
  const completed = rows.filter((r) => r.status === "completed").length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const in_progress = rows.filter((r) => r.status === "in_progress").length;
  const gagal_partial = rows.filter((r) => r.status === "gagal_partial").length;
  const gagal_total = rows.filter((r) => r.status === "gagal_total").length;

  const today = todayString();
  const late_count = rows.filter(
    (r) => r.visit_date < today && !["completed", "gagal_total", "gagal_partial"].includes(r.status),
  ).length;

  const officerMap = new Map<string, { name: string; total: number; completed: number }>();
  for (const r of rows) {
    const existing = officerMap.get(r.user_name) ?? { name: r.user_name, total: 0, completed: 0 };
    existing.total++;
    if (r.status === "completed") existing.completed++;
    officerMap.set(r.user_name, existing);
  }
  const by_officer = Array.from(officerMap.entries()).map(([user_name, d]) => ({
    user_id: user_name,
    user_name,
    total: d.total,
    completed: d.completed,
    completion_rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }));

  const kabMap = new Map<string, { name: string; total: number; completed: number }>();
  for (const r of rows) {
    const existing = kabMap.get(r.kabupaten_name) ?? { name: r.kabupaten_name, total: 0, completed: 0 };
    existing.total++;
    if (r.status === "completed") existing.completed++;
    kabMap.set(r.kabupaten_name, existing);
  }
  const by_kabupaten = Array.from(kabMap.entries()).map(([kabupaten_name, d]) => ({
    kabupaten_id: kabupaten_name,
    kabupaten_name,
    total: d.total,
    completed: d.completed,
  }));

  const kecMap = new Map<string, { name: string; total: number; completed: number }>();
  for (const r of rows) {
    const existing = kecMap.get(r.kecamatan_name) ?? { name: r.kecamatan_name, total: 0, completed: 0 };
    existing.total++;
    if (r.status === "completed") existing.completed++;
    kecMap.set(r.kecamatan_name, existing);
  }
  const by_kecamatan = Array.from(kecMap.entries()).map(([kecamatan_name, d]) => ({
    kecamatan_id: kecamatan_name,
    kecamatan_name,
    total: d.total,
    completed: d.completed,
  }));

  const dayMap = new Map<string, { total: number; completed: number }>();
  for (const r of rows) {
    const existing = dayMap.get(r.visit_date) ?? { total: 0, completed: 0 };
    existing.total++;
    if (r.status === "completed") existing.completed++;
    dayMap.set(r.visit_date, existing);
  }
  const daily_data = Array.from(dayMap.entries())
    .map(([date, d]) => ({ date, total: d.total, completed: d.completed }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_schedules: total,
    completed,
    pending,
    in_progress,
    gagal_partial,
    gagal_total,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    late_count,
    by_officer,
    by_kabupaten,
    by_kecamatan,
    daily_data,
  };
}
