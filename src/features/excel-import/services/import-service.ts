import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createMasterUpserter } from "./master-upsert";
import { createUserUpserter } from "./user-upsert";
import type { ExcelRow, ImportPreview, ImportResult, ColumnMapping } from "../types";

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.text !== undefined) return String(obj.text);
    if (obj.result !== undefined) return cellToString(obj.result);
    if (obj.value !== undefined) return cellToString(obj.value);
    return JSON.stringify(value);
  }
  return String(value);
}

function sheetToJson(ws: ExcelJS.Worksheet): ExcelRow[] {
  const rows: ExcelRow[] = [];
  const headers: string[] = [];

  ws.eachRow((row, rowNumber) => {
    const values = (row.values as unknown[]).slice(1);

    if (rowNumber === 1) {
      values.forEach((v) => headers.push(cellToString(v)));
      return;
    }

    const obj: ExcelRow = {};
    values.forEach((v, i) => {
      obj[headers[i] ?? `col${i}`] = cellToString(v);
    });
    rows.push(obj);
  });

  return rows;
}

function assertValidXlsx(file: Buffer) {
  if (!file || file.length < 4) {
    throw new Error("File Excel kosong atau rusak");
  }
  const isZip =
    file[0] === 0x50 && file[1] === 0x4b && file[2] === 0x03 && file[3] === 0x04;
  if (!isZip) {
    throw new Error(
      "File bukan .xlsx yang valid. Gunakan format .xlsx (Excel 2007+), bukan .xls",
    );
  }
}

export async function parseExcelFile(file: Buffer): Promise<ImportPreview> {
  assertValidXlsx(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ArrayBuffer);

  const ws = workbook.worksheets[0];
  if (!ws) {
    throw new Error("File Excel kosong atau tidak memiliki data");
  }

  const data = sheetToJson(ws);

  if (data.length === 0) {
    throw new Error("File Excel kosong atau tidak memiliki data");
  }

  const columns = Object.keys(data[0]);

  return {
    columns,
    rows: data.slice(0, 5),
    totalRows: data.length,
  };
}

export async function getFullData(file: Buffer): Promise<ExcelRow[]> {
  assertValidXlsx(file);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ArrayBuffer);

  const ws = workbook.worksheets[0];
  if (!ws) return [];

  return sheetToJson(ws);
}

export async function bulkImportSchedules(
  data: ExcelRow[],
  mapping: ColumnMapping,
  userId: string,
): Promise<ImportResult> {
  const admin = createAdminClient();
  const result: ImportResult = { id: "", success: 0, errors: 0, errorRows: [] };

  // Create import record
  const { data: importRecord, error: createError } = await admin
    .from("excel_imports")
    .insert({
      user_id: userId,
      filename: "import.xlsx",
      total_rows: data.length,
      status: "processing",
      column_mapping: mapping,
    })
    .select()
    .single();

  if (createError) throw createError;
  result.id = importRecord.id;

  // Get all users for lookup (master data and officers are auto-created on demand)
  const upsert = createMasterUpserter();
  const userUpsert = createUserUpserter();

  const errors: Array<{ row: number; message: string }> = [];

  // Replace data lapang: soft-delete jadwal yang belum dikerjakan (pending).
  // Jadwal yang sudah dikerjakan (on_the_way/in_progress/completed/cancelled) dilindungi.
  const { count: replacedCount, error: replaceError } = await admin
    .from("schedules")
    .update({ deleted_at: new Date().toISOString() })
    .eq("status", "pending")
    .is("deleted_at", null);

  if (replaceError) {
    errors.push({ row: 0, message: `Gagal replace data lama: ${replaceError.message}` });
  }
  const replaced = replacedCount ?? 0;

  const schedulesToInsert: Array<{
    user_id: string;
    kabupaten_id: string;
    kecamatan_id: string;
    desa_id: string;
    visit_date: string;
    created_by: string;
  }> = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    const userName = row[mapping.user_name]?.trim();
    const kabName = row[mapping.kabupaten_name]?.trim();
    const kecName = row[mapping.kecamatan_name]?.trim();
    const desaName = row[mapping.desa_name]?.trim();
    const visitDate = row[mapping.visit_date]?.trim();

    if (!userName || !kabName || !kecName || !desaName || !visitDate) {
      errors.push({ row: rowNum, message: "Data tidak lengkap" });
      continue;
    }

    if (!isValidDate(visitDate)) {
      errors.push({ row: rowNum, message: `Tanggal kunjungan tidak valid: ${visitDate}` });
      continue;
    }

    const ids = await upsert.resolve(kabName, kecName, desaName);
    if (!ids) {
      errors.push({
        row: rowNum,
        message: `Gagal membuat/master data untuk ${kabName} / ${kecName} / ${desaName}`,
      });
      continue;
    }

    const userId_res = await userUpsert.resolve(userName);
    if (!userId_res) {
      errors.push({ row: rowNum, message: `Gagal membuat petugas "${userName}"` });
      continue;
    }

    schedulesToInsert.push({
      user_id: userId_res,
      kabupaten_id: ids.kabupaten_id,
      kecamatan_id: ids.kecamatan_id,
      desa_id: ids.desa_id,
      visit_date: visitDate,
      created_by: userId,
    });
  }

  if (schedulesToInsert.length > 0) {
    const unique = dedupeSchedules(schedulesToInsert);
    const { error: insertError } = await admin
      .from("schedules")
      .insert(unique);

    if (insertError) {
      errors.push({ row: 0, message: `Gagal insert: ${insertError.message}` });
    } else {
      result.success = unique.length;
      const duplicateCount = schedulesToInsert.length - unique.length;
      if (duplicateCount > 0) {
        errors.push({ row: 0, message: `${duplicateCount} baris duplikat dilewati` });
      }
    }
  }

  result.errors = errors.length;
  result.errorRows = errors;
  result.replaced = replaced;
  result.created = { ...upsert.created, users: userUpsert.created };

  await admin
    .from("excel_imports")
    .update({
      success_rows: result.success,
      error_rows: result.errors,
      status: "completed",
      error_log: errors,
    })
    .eq("id", importRecord.id);

  return result;
}

function isValidDate(value: string): boolean {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(value)) {
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const [y, m, day] = value.split("-").map(Number);
  return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day;
}

function dedupeSchedules(
  rows: Array<{ user_id: string; kabupaten_id: string; kecamatan_id: string; desa_id: string; visit_date: string; created_by: string }>,
): typeof rows {
  const seen = new Set<string>();
  const result: typeof rows = [];
  for (const r of rows) {
    const key = `${r.user_id}|${r.desa_id}|${r.visit_date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(r);
  }
  return result;
}
