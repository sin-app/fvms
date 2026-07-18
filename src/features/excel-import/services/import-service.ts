import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { ExcelRow, ImportPreview, ImportResult, ColumnMapping } from "../types";

function sheetToJson(ws: ExcelJS.Worksheet): ExcelRow[] {
  const rows: ExcelRow[] = [];
  const headers: string[] = [];

  ws.eachRow((row, rowNumber) => {
    const values = (row.values as unknown[]).slice(1);

    if (rowNumber === 1) {
      values.forEach((v) => headers.push(String(v ?? "")));
      return;
    }

    const obj: ExcelRow = {};
    values.forEach((v, i) => {
      obj[headers[i] ?? `col${i}`] = String(v ?? "");
    });
    rows.push(obj);
  });

  return rows;
}

export async function parseExcelFile(file: Buffer): Promise<ImportPreview> {
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

  // Get all users, kabupaten, kecamatan, desa for lookup
  const [usersRes, kabRes, kecRes, desaRes] = await Promise.all([
    admin.from("users").select("id, name"),
    admin.from("kabupaten").select("id, name"),
    admin.from("kecamatan").select("id, name, kabupaten_id"),
    admin.from("desa").select("id, name, kecamatan_id"),
  ]);

  const users = usersRes.data ?? [];
  const kabupatenList = kabRes.data ?? [];
  const kecamatanList = kecRes.data ?? [];
  const desaList = desaRes.data ?? [];

  const errors: Array<{ row: number; message: string }> = [];
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

    const user = users.find((u) => u.name.toLowerCase() === userName.toLowerCase());
    if (!user) {
      errors.push({ row: rowNum, message: `Petugas "${userName}" tidak ditemukan` });
      continue;
    }

    const kab = kabupatenList.find((k) => k.name.toLowerCase() === kabName.toLowerCase());
    if (!kab) {
      errors.push({ row: rowNum, message: `Kabupaten "${kabName}" tidak ditemukan` });
      continue;
    }

    const kec = kecamatanList.find(
      (k) => k.name.toLowerCase() === kecName.toLowerCase() && k.kabupaten_id === kab.id,
    );
    if (!kec) {
      errors.push({ row: rowNum, message: `Kecamatan "${kecName}" tidak ditemukan di ${kabName}` });
      continue;
    }

    const desa = desaList.find(
      (d) => d.name.toLowerCase() === desaName.toLowerCase() && d.kecamatan_id === kec.id,
    );
    if (!desa) {
      errors.push({ row: rowNum, message: `Desa "${desaName}" tidak ditemukan di ${kecName}` });
      continue;
    }

    schedulesToInsert.push({
      user_id: user.id,
      kabupaten_id: kab.id,
      kecamatan_id: kec.id,
      desa_id: desa.id,
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
