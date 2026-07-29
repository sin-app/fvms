import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext, qcKabupatenScope } from "@/lib/auth/authorization";
import { todayString } from "@/lib/utils/date";
import type { ReportFilters, ReportData } from "../types";
import type { ReportRow } from "../types/report-data";
import ExcelJS from "exceljs";
import { SCHEDULE_STATUSES } from "@/lib/constants/status";
import { deriveScheduleStatus, getPanenStatus } from "@/features/panen/services/panen-logic";

export async function getReportData(filters: ReportFilters): Promise<ReportData> {
  const admin = createAdminClient();

  const ctx = await getAuthContext();
  const scopeUserId =
    ctx && ctx.role !== "admin" && ctx.role !== "qc" ? ctx.userId : filters.user_id;
  const kabScope = ctx ? qcKabupatenScope(ctx) : null;

  // Date range is required to avoid unbounded full-table scans.
  if (!filters.date_from || !filters.date_to) {
    throw new Error("Rentang tanggal wajib diisi untuk membuat laporan");
  }

  let query = admin
    .from("schedules")
    .select("id, status, visit_date, user_id, kabupaten_id, kecamatan_id, real_tanam_ha, gagal_tanam, tgl_panen, real_panen, users!schedules_user_id_fkey(name), kabupaten(name), kecamatan(name), visit_time", { count: "exact" })
    .is("deleted_at", null)
    .gte("visit_date", filters.date_from)
    .lte("visit_date", filters.date_to);

  if (scopeUserId) query = query.eq("user_id", scopeUserId);
  if (kabScope !== null) {
    query = query.in("kabupaten_id", kabScope.length > 0 ? kabScope : ["__none__"]);
  } else if (filters.kabupaten_id) {
    query = query.eq("kabupaten_id", filters.kabupaten_id);
  }
  if (filters.kecamatan_id) {
    query = query.eq("kecamatan_id", filters.kecamatan_id);
  }
  if (filters.label) {
    query = query.eq("label", filters.label);
  }
  if (filters.member_name) {
    query = query.ilike("member_name", `%${filters.member_name}%`);
  }
  if (filters.block_no) {
    query = query.ilike("block_no", `%${filters.block_no}%`);
  }
  if (filters.no_plot) {
    query = query.ilike("no_plot", `%${filters.no_plot}%`);
  }
  if (filters.nis) {
    query = query.ilike("nis", `%${filters.nis}%`);
  }
  if (filters.cgr) {
    query = query.ilike("cgr", `%${filters.cgr}%`);
  }
  if (filters.varietas) {
    query = query.ilike("document_no", `%${filters.varietas}%`);
  }
  if (filters.panen_status && filters.panen_status !== "all") {
    if (filters.panen_status === "sudah") {
      query = query.or("tgl_panen.not.is.NULL,real_panen.not.is.NULL");
    } else if (filters.panen_status === "jatuh_tempo") {
      query = query.is("tgl_panen", null).is("real_panen", null).not("rencana_panen", "is", null).lt("rencana_panen", todayString()).not("status", "in", "(completed,gagal_total)");
    } else if (filters.panen_status === "belum") {
      query = query.is("tgl_panen", null).is("real_panen", null).or(`rencana_panen.gte.${todayString()},rencana_panen.is.null`);
    }
  }

  const { data: rawSchedules } = await query;

  if (!rawSchedules) {
    return {
      total_schedules: 0, completed: 0, pending: 0,
      in_progress: 0, gagal_partial: 0, gagal_total: 0, completion_rate: 0, late_count: 0,
      by_officer: [], by_kabupaten: [], by_kecamatan: [], daily_data: [],
    };
  }

  // Derive actual status from real_tanam_ha/gagal_tanam, not just stored status
  const schedules = rawSchedules.map((s) => {
    const derived = deriveScheduleStatus({
      real_tanam_ha: (s as unknown as ReportRowRelation).real_tanam_ha,
      gagal_tanam: (s as unknown as ReportRowRelation).gagal_tanam,
    });
    return {
      ...s,
      actualStatus: derived ? derived.status : s.status,
    };
  });

  const total = schedules.length;
  const completed = schedules.filter((s) => s.actualStatus === "completed").length;
  const pending = schedules.filter((s) => s.actualStatus === "pending").length;
  const in_progress = schedules.filter((s) => s.actualStatus === "in_progress").length;
  const gagal_partial = schedules.filter((s) => s.actualStatus === "gagal_partial").length;
  const gagal_total = schedules.filter((s) => s.actualStatus === "gagal_total").length;

  const today = todayString();
  const late_count = schedules.filter(
    (s) => s.visit_date < today && !["completed", "gagal_total"].includes(s.actualStatus),
  ).length;

  // By officer
  const officerMap = new Map<string, { name: string; total: number; completed: number }>();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  schedules.forEach((s) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const uid = (s as unknown as ReportRowRelation).user_id;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const uname = (s as unknown as ReportRowRelation).users?.name ?? "Unknown";
    const existing = officerMap.get(uid) ?? { name: uname, total: 0, completed: 0 };
    existing.total++;
    if (s.actualStatus === "completed") existing.completed++;
    officerMap.set(uid, existing);
  });

  const by_officer = Array.from(officerMap.entries()).map(([user_id, d]) => ({
    user_id,
    user_name: d.name,
    total: d.total,
    completed: d.completed,
    completion_rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }));

  // By kabupaten
  const kabMap = new Map<string, { name: string; total: number; completed: number }>();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  schedules.forEach((s) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kid = (s as unknown as ReportRowRelation).kabupaten_id;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kname = (s as unknown as ReportRowRelation).kabupaten?.name ?? "Unknown";
    const existing = kabMap.get(kid) ?? { name: kname, total: 0, completed: 0 };
    existing.total++;
    if (s.actualStatus === "completed") existing.completed++;
    kabMap.set(kid, existing);
  });

  const by_kabupaten = Array.from(kabMap.entries()).map(([kabupaten_id, d]) => ({
    kabupaten_id,
    kabupaten_name: d.name,
    total: d.total,
    completed: d.completed,
  }));

  // By kecamatan (only when schedules have kecamatan data)
  const kecMap = new Map<string, { name: string; total: number; completed: number }>();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  schedules.forEach((s) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kid = (s as unknown as ReportRowRelation).kecamatan_id;
    if (!kid) return;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const kname = (s as unknown as ReportRowRelation).kecamatan?.name ?? "Unknown";
    const existing = kecMap.get(kid) ?? { name: kname, total: 0, completed: 0 };
    existing.total++;
    if (s.actualStatus === "completed") existing.completed++;
    kecMap.set(kid, existing);
  });

  const by_kecamatan = Array.from(kecMap.entries()).map(([kecamatan_id, d]) => ({
    kecamatan_id,
    kecamatan_name: d.name,
    total: d.total,
    completed: d.completed,
  }));

  // Daily data
  const dayMap = new Map<string, { total: number; completed: number }>();
  schedules.forEach((s) => {
    const date = s.visit_date;
    const existing = dayMap.get(date) ?? { total: 0, completed: 0 };
    existing.total++;
    if (s.actualStatus === "completed") existing.completed++;
    dayMap.set(date, existing);
  });

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

interface ReportRowRelation {
  id: string;
  visit_date: string;
  status: string;
  user_id: string;
  kabupaten_id: string;
  kecamatan_id: string;
  visit_time: string | null;
  rencana_panen: string | null;
  real_panen: string | null;
  tgl_panen: string | null;
  label: string | null;
  member_name: string | null;
  block_no: string | null;
  no_plot: string | null;
  nis: string | null;
  cgr: string | null;
  document_no: string | null;
  tgl_tanam: string | null;
  ph_tanah: string | null;
  real_tanam_ha: number | null;
  gagal_tanam: number | null;
  sisa_di_lahan_ha: number | null;
  detaseling: string | null;
  users?: { name: string } | null;
  kabupaten?: { name: string } | null;
  kecamatan?: { name: string } | null;
  desa?: { name: string } | null;
}

export const MAX_REPORT_ROWS = 10000;

export async function getReportRows(filters: ReportFilters): Promise<ReportRow[]> {
  const admin = createAdminClient();

  const ctx = await getAuthContext();
  const scopeUserId =
    ctx && ctx.role !== "admin" && ctx.role !== "qc" ? ctx.userId : filters.user_id;
  const kabScope = ctx ? qcKabupatenScope(ctx) : null;

  if (!filters.date_from || !filters.date_to) {
    throw new Error("Rentang tanggal wajib diisi untuk membuat laporan");
  }

  let query = admin
    .from("schedules")
    .select("id, visit_date, status, visit_time, label, rencana_panen, real_panen, tgl_panen, member_name, block_no, no_plot, nis, cgr, document_no, tgl_tanam, ph_tanah, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, detaseling, users!schedules_user_id_fkey(name), kabupaten(name), kecamatan(name), desa(name)")
    .is("deleted_at", null)
    .gte("visit_date", filters.date_from)
    .lte("visit_date", filters.date_to)
    .order("visit_date", { ascending: true })
    .limit(MAX_REPORT_ROWS);

  if (scopeUserId) query = query.eq("user_id", scopeUserId);
  if (kabScope !== null) {
    query = query.in("kabupaten_id", kabScope.length > 0 ? kabScope : ["__none__"]);
  } else if (filters.kabupaten_id) {
    query = query.eq("kabupaten_id", filters.kabupaten_id);
  }
  if (filters.kecamatan_id) {
    query = query.eq("kecamatan_id", filters.kecamatan_id);
  }
  if (filters.label) {
    query = query.eq("label", filters.label);
  }
  if (filters.member_name) {
    query = query.ilike("member_name", `%${filters.member_name}%`);
  }
  if (filters.block_no) {
    query = query.ilike("block_no", `%${filters.block_no}%`);
  }
  if (filters.no_plot) {
    query = query.ilike("no_plot", `%${filters.no_plot}%`);
  }
  if (filters.nis) {
    query = query.ilike("nis", `%${filters.nis}%`);
  }
  if (filters.cgr) {
    query = query.ilike("cgr", `%${filters.cgr}%`);
  }
  if (filters.varietas) {
    query = query.ilike("document_no", `%${filters.varietas}%`);
  }
  if (filters.panen_status && filters.panen_status !== "all") {
    if (filters.panen_status === "sudah") {
      query = query.or("tgl_panen.not.is.NULL,real_panen.not.is.NULL");
    } else if (filters.panen_status === "jatuh_tempo") {
      query = query.is("tgl_panen", null).is("real_panen", null).not("rencana_panen", "is", null).lt("rencana_panen", todayString()).not("status", "in", "(completed,gagal_total)");
    } else if (filters.panen_status === "belum") {
      query = query.is("tgl_panen", null).is("real_panen", null).or(`rencana_panen.gte.${todayString()},rencana_panen.is.null`);
    }
  }

  const { data } = await query;

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (data as unknown as ReportRowRelation[]).map((s) => {
    const ps = getPanenStatus({
      tgl_panen: s.tgl_panen,
      real_panen: s.real_panen,
      rencana_panen: s.rencana_panen,
      tgl_tanam: s.tgl_tanam,
      cgr: s.cgr,
    });
    const derived = deriveScheduleStatus({
      real_tanam_ha: s.real_tanam_ha,
      gagal_tanam: s.gagal_tanam,
    });
    const actualStatus = derived ? derived.status : s.status;
    return {
      id: s.id,
      visit_date: s.visit_date,
      user_name: s.users?.name ?? "—",
      kabupaten_name: s.kabupaten?.name ?? "—",
      kecamatan_name: s.kecamatan?.name ?? "—",
      desa_name: s.desa?.name ?? "—",
      status: actualStatus,
      visit_time: s.visit_time,
      has_notes: false,
      rencana_panen: s.rencana_panen ?? null,
      real_panen: s.real_panen ?? null,
      tgl_panen: s.tgl_panen ?? null,
      label: s.label ?? null,
      member_name: s.member_name ?? null,
      block_no: s.block_no ?? null,
      no_plot: s.no_plot ?? null,
      nis: s.nis ?? null,
      cgr: s.cgr ?? null,
      varietas: s.document_no ?? null,
      panen_status: ps.label,
      ph_tanah: s.ph_tanah ?? null,
      tgl_tanam: s.tgl_tanam ?? null,
      real_tanam_ha: s.real_tanam_ha ?? null,
      gagal_tanam: s.gagal_tanam ?? null,
      sisa_di_lahan_ha: s.sisa_di_lahan_ha ?? null,
      detaseling: s.detaseling ?? null,
    };
  });
}

export async function exportToExcel(rows: ReportRow[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Laporan");

  ws.columns = [
    { header: "Tanggal", key: "Tanggal" },
    { header: "Kabupaten", key: "Kabupaten" },
    { header: "Kecamatan", key: "Kecamatan" },
    { header: "Desa", key: "Desa" },
    { header: "Petugas", key: "Petugas" },
    { header: "CGR", key: "CGR" },
    { header: "Block", key: "Block" },
    { header: "Plot", key: "Plot" },
    { header: "Member", key: "Member" },
    { header: "Doc No", key: "DocNo" },
    { header: "NIS", key: "NIS" },
    { header: "PH Tanah", key: "PHTanah" },
    { header: "Tgl Tanam", key: "TglTanam" },
    { header: "Real Tanam", key: "RealTanam" },
    { header: "Gagal Tanam", key: "GagalTanam" },
    { header: "Sisa Lahan", key: "SisaLahan" },
    { header: "Detaseling", key: "Detaseling" },
    { header: "Label", key: "Label" },
    { header: "Panen", key: "Panen" },
    { header: "Status", key: "Status" },
  ];

  for (const r of rows) {
    ws.addRow({
      Tanggal: r.visit_date,
      Kabupaten: r.kabupaten_name,
      Kecamatan: r.kecamatan_name,
      Desa: r.desa_name,
      Petugas: r.user_name,
      CGR: r.cgr ?? "",
      Block: r.block_no ?? "",
      Plot: r.no_plot ?? "",
      Member: r.member_name ?? "",
      DocNo: r.varietas ?? "",
      NIS: r.nis ?? "",
      PHTanah: r.ph_tanah ?? "",
      TglTanam: r.tgl_tanam ?? "",
      RealTanam: r.real_tanam_ha?.toString() ?? "",
      GagalTanam: r.gagal_tanam?.toString() ?? "",
      SisaLahan: r.sisa_di_lahan_ha?.toString() ?? "",
      Detaseling: r.detaseling ?? "",
      Label: r.label ?? "",
      Panen: r.panen_status ?? "",
      Status: r.status,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
