"use server";

import { getReportData, getReportRows, exportToExcel } from "../services/report-service";
import type { ReportFilters } from "../types";

export async function fetchReportData(filters: ReportFilters) {
  return getReportData(filters);
}

export async function fetchReportRows(filters: ReportFilters) {
  return getReportRows(filters);
}

export async function downloadExcelAction(filters: ReportFilters): Promise<{ data: string; filename: string }> {
  const rows = await getReportRows(filters);
  const buffer = exportToExcel(rows);
  const base64 = Buffer.from(new Uint8Array(buffer)).toString("base64");
  return {
    data: base64,
    filename: `laporan-kunjungan-${new Date().toISOString().split("T")[0]}.xlsx`,
  };
}
