import { createAdminClient } from "@/lib/supabase/admin-client";
import type { ReportFilters, ReportData } from "../types";
import type { ReportRow } from "../types/report-data";
import ExcelJS from "exceljs";
import { SCHEDULE_STATUSES } from "@/lib/constants/status";

export async function getReportData(filters: ReportFilters): Promise<ReportData> {
  const admin = createAdminClient();

  // Date range is required to avoid unbounded full-table scans.
  if (!filters.date_from || !filters.date_to) {
    throw new Error("Rentang tanggal wajib diisi untuk membuat laporan");
  }

  let query = admin
    .from("schedules")
    .select("id, status, visit_date, user_id, kabupaten_id, user!inner(name), kabupaten!inner(name), visit_time", { count: "exact" })
    .is("deleted_at", null)
    .gte("visit_date", filters.date_from)
    .lte("visit_date", filters.date_to);

  if (filters.user_id) query = query.eq("user_id", filters.user_id);
  if (filters.kabupaten_id) query = query.eq("kabupaten_id", filters.kabupaten_id);
  if (filters.status && SCHEDULE_STATUSES.includes(filters.status as (typeof SCHEDULE_STATUSES)[number])) {
    query = query.eq("status", filters.status);
  }

  const { data: schedules } = await query;

  if (!schedules) {
    return {
      total_schedules: 0, completed: 0, cancelled: 0, pending: 0,
      on_the_way: 0, in_progress: 0, completion_rate: 0, late_count: 0,
      by_officer: [], by_kabupaten: [], daily_data: [],
    };
  }

  const total = schedules.length;
  const completed = schedules.filter((s) => s.status === "completed").length;
  const cancelled = schedules.filter((s) => s.status === "cancelled").length;
  const pending = schedules.filter((s) => s.status === "pending").length;
  const on_the_way = schedules.filter((s) => s.status === "on_the_way").length;
  const in_progress = schedules.filter((s) => s.status === "in_progress").length;

  const today = new Date().toISOString().split("T")[0];
  const late_count = schedules.filter(
    (s) => s.visit_date < today && !["completed", "cancelled"].includes(s.status),
  ).length;

  // By officer
  const officerMap = new Map<string, { name: string; total: number; completed: number }>();
  schedules.forEach((s) => {
    const uid = (s as unknown as ReportRowRelation).user_id;
    const uname = (s as unknown as ReportRowRelation).user?.name ?? "Unknown";
    const existing = officerMap.get(uid) ?? { name: uname, total: 0, completed: 0 };
    existing.total++;
    if (s.status === "completed") existing.completed++;
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
  schedules.forEach((s) => {
    const kid = (s as unknown as ReportRowRelation).kabupaten_id;
    const kname = (s as unknown as ReportRowRelation).kabupaten?.name ?? "Unknown";
    const existing = kabMap.get(kid) ?? { name: kname, total: 0, completed: 0 };
    existing.total++;
    if (s.status === "completed") existing.completed++;
    kabMap.set(kid, existing);
  });

  const by_kabupaten = Array.from(kabMap.entries()).map(([kabupaten_id, d]) => ({
    kabupaten_id,
    kabupaten_name: d.name,
    total: d.total,
    completed: d.completed,
  }));

  // Daily data
  const dayMap = new Map<string, { total: number; completed: number }>();
  schedules.forEach((s) => {
    const date = s.visit_date;
    const existing = dayMap.get(date) ?? { total: 0, completed: 0 };
    existing.total++;
    if (s.status === "completed") existing.completed++;
    dayMap.set(date, existing);
  });

  const daily_data = Array.from(dayMap.entries())
    .map(([date, d]) => ({ date, total: d.total, completed: d.completed }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_schedules: total,
    completed,
    cancelled,
    pending,
    on_the_way,
    in_progress,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    late_count,
    by_officer,
    by_kabupaten,
    daily_data,
  };
}

interface ReportRowRelation {
  id: string;
  visit_date: string;
  status: string;
  user_id: string;
  kabupaten_id: string;
  visit_time: string | null;
  user?: { name: string } | null;
  kabupaten?: { name: string } | null;
  kecamatan?: { name: string } | null;
  desa?: { name: string } | null;
}

export const MAX_REPORT_ROWS = 10000;

export async function getReportRows(filters: ReportFilters): Promise<ReportRow[]> {
  const admin = createAdminClient();

  if (!filters.date_from || !filters.date_to) {
    throw new Error("Rentang tanggal wajib diisi untuk membuat laporan");
  }

  let query = admin
    .from("schedules")
    .select("id, visit_date, status, visit_time, user!inner(name), kabupaten!inner(name), kecamatan!inner(name), desa!inner(name)")
    .is("deleted_at", null)
    .gte("visit_date", filters.date_from)
    .lte("visit_date", filters.date_to)
    .order("visit_date", { ascending: true })
    .limit(MAX_REPORT_ROWS);

  if (filters.user_id) query = query.eq("user_id", filters.user_id);
  if (filters.kabupaten_id) query = query.eq("kabupaten_id", filters.kabupaten_id);

  const { data } = await query;

  if (!data) return [];

  return (data as unknown as ReportRowRelation[]).map((s) => ({
    id: s.id,
    visit_date: s.visit_date,
    user_name: s.user?.name ?? "—",
    kabupaten_name: s.kabupaten?.name ?? "—",
    kecamatan_name: s.kecamatan?.name ?? "—",
    desa_name: s.desa?.name ?? "—",
    status: s.status,
    visit_time: s.visit_time,
    has_notes: false,
  }));
}

export async function exportToExcel(rows: ReportRow[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Laporan");

  ws.columns = [
    { header: "Tanggal", key: "Tanggal" },
    { header: "Petugas", key: "Petugas" },
    { header: "Kabupaten", key: "Kabupaten" },
    { header: "Kecamatan", key: "Kecamatan" },
    { header: "Desa", key: "Desa" },
    { header: "Status", key: "Status" },
    { header: "Waktu Kunjungan", key: "Waktu Kunjungan" },
  ];

  for (const r of rows) {
    ws.addRow({
      Tanggal: r.visit_date,
      Petugas: r.user_name,
      Kabupaten: r.kabupaten_name,
      Kecamatan: r.kecamatan_name,
      Desa: r.desa_name,
      Status: r.status,
      "Waktu Kunjungan": r.visit_time ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
