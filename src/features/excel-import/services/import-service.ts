import ExcelJS from "exceljs";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createMasterUpserter } from "./master-upsert";
import { createUserUpserter } from "./user-upsert";
import type { ExcelRow, ImportPreview, ImportResult, ColumnMapping } from "../types";
import { notifyImportCompleted } from "@/features/notifications/services/notification-service";

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

  // Import menambah (append) jadwal baru tanpa menghapus data sebelumnya,
  // agar import bertahap per varietas tidak menghilangkan jadwal lama.
  // Duplikat dalam satu file dicegah oleh dedupeSchedules di bawah.

  // Validate rows & collect unique names for batch resolution.
  interface ValidRow {
    rowNum: number;
    user: string;
    kab: string;
    kec: string;
    desa: string;
    date: string;
    tgl_tanam?: string;
    tgl_panen?: string;
    cgr?: string;
    cgr_code?: string;
    block_no?: string;
    no_plot?: string;
    member_name?: string;
    document_no?: string;
    ph_tanah?: number;
    nis?: string;
    real_tanam_ha?: number;
    gagal_tanam?: number;
    sisa_di_lahan_ha?: number;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    visit_time?: string;
    notes?: string;
  }
  const valid: ValidRow[] = [];
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

    const v: ValidRow = { rowNum, user: userName, kab: kabName, kec: kecName, desa: desaName, date: visitDate };

    if (mapping.latitude) {
      const n = parseNumber(row[mapping.latitude]);
      if (n !== null) v.latitude = n;
    }
    if (mapping.longitude) {
      const n = parseNumber(row[mapping.longitude]);
      if (n !== null) v.longitude = n;
    }
    if (mapping.accuracy) {
      const n = parseNumber(row[mapping.accuracy]);
      if (n !== null) v.accuracy = n;
    }
    if (mapping.visit_time) {
      const t = parseVisitTime(visitDate, row[mapping.visit_time]);
      if (t) v.visit_time = t;
    }
    if (mapping.notes) {
      const txt = row[mapping.notes]?.trim();
      if (txt) v.notes = txt;
    }

    if (mapping.tgl_tanam) {
      const d = row[mapping.tgl_tanam]?.trim();
      if (d && isValidDate(d)) v.tgl_tanam = d;
    }
    if (mapping.cgr) v.cgr = row[mapping.cgr]?.trim() || undefined;
    if (mapping.cgr_code) v.cgr_code = row[mapping.cgr_code]?.trim() || undefined;
    if (mapping.block_no) v.block_no = row[mapping.block_no]?.trim() || undefined;
    if (mapping.no_plot) v.no_plot = row[mapping.no_plot]?.trim() || undefined;
    if (mapping.member_name) v.member_name = row[mapping.member_name]?.trim() || undefined;
    if (mapping.document_no) v.document_no = row[mapping.document_no]?.trim() || undefined;
    if (mapping.ph_tanah) {
      const n = parseNumber(row[mapping.ph_tanah]);
      if (n !== null) v.ph_tanah = n;
    }
    if (mapping.nis) v.nis = row[mapping.nis]?.trim() || undefined;
    if (mapping.real_tanam_ha) {
      const n = parseNumber(row[mapping.real_tanam_ha]);
      if (n !== null) v.real_tanam_ha = n;
    }
    if (mapping.gagal_tanam) {
      const n = parseNumber(row[mapping.gagal_tanam]);
      if (n !== null) v.gagal_tanam = n;
    }
    if (mapping.sisa_di_lahan_ha) {
      const n = parseNumber(row[mapping.sisa_di_lahan_ha]);
      if (n !== null) v.sisa_di_lahan_ha = n;
    }

    if (mapping.tgl_panen) {
      const d = row[mapping.tgl_panen]?.trim();
      if (d && isValidDate(d)) v.tgl_panen = d;
    }

    valid.push(v);
  }

  // Batch-resolve master data & officers (few queries instead of per-row).
  const master = await upsert.resolveAll(
    valid.map((r) => ({ kab: r.kab, kec: r.kec, desa: r.desa })),
  );
  const userOut = await userUpsert.resolveAll(valid.map((r) => r.user));

  const schedulesToInsert: Array<{
    user_id: string;
    kabupaten_id: string;
    kecamatan_id: string;
    desa_id: string;
    visit_date: string;
    created_by: string;
    tgl_tanam?: string;
    tgl_panen?: string;
    cgr?: string;
    cgr_code?: string;
    block_no?: string;
    no_plot?: string;
    member_name?: string;
    document_no?: string;
    ph_tanah?: number;
    nis?: string;
    real_tanam_ha?: number;
    gagal_tanam?: number;
    sisa_di_lahan_ha?: number;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    visit_time?: string;
    notes?: string;
  }> = [];

  for (const r of valid) {
    const kabupaten_id = master.kabupaten.get(r.kab.toLowerCase());
    const kecamatan_id = master.kecamatan.get(r.kec.toLowerCase());
    const desa_id = master.desa.get(r.desa.toLowerCase());
    const user_id = userOut.map.get(r.user.toLowerCase());

    if (!kabupaten_id || !kecamatan_id || !desa_id || !user_id) {
      errors.push({
        row: r.rowNum,
        message: `Gagal resolve data untuk ${r.kab} / ${r.kec} / ${r.desa} / ${r.user}`,
      });
      continue;
    }

    schedulesToInsert.push({
      user_id,
      kabupaten_id,
      kecamatan_id,
      desa_id,
      visit_date: r.date,
      created_by: userId,
      ...(r.tgl_tanam !== undefined ? { tgl_tanam: r.tgl_tanam } : {}),
      ...(r.tgl_panen !== undefined ? { tgl_panen: r.tgl_panen } : {}),
      ...(r.cgr !== undefined ? { cgr: r.cgr } : {}),
      ...(r.cgr_code !== undefined ? { cgr_code: r.cgr_code } : {}),
      ...(r.block_no !== undefined ? { block_no: r.block_no } : {}),
      ...(r.no_plot !== undefined ? { no_plot: r.no_plot } : {}),
      ...(r.member_name !== undefined ? { member_name: r.member_name } : {}),
      ...(r.document_no !== undefined ? { document_no: r.document_no } : {}),
      ...(r.ph_tanah !== undefined ? { ph_tanah: r.ph_tanah } : {}),
      ...(r.nis !== undefined ? { nis: r.nis } : {}),
      ...(r.real_tanam_ha !== undefined ? { real_tanam_ha: r.real_tanam_ha } : {}),
      ...(r.gagal_tanam !== undefined ? { gagal_tanam: r.gagal_tanam } : {}),
      ...(r.sisa_di_lahan_ha !== undefined ? { sisa_di_lahan_ha: r.sisa_di_lahan_ha } : {}),
      ...(r.latitude !== undefined ? { latitude: r.latitude } : {}),
      ...(r.longitude !== undefined ? { longitude: r.longitude } : {}),
      ...(r.accuracy !== undefined ? { accuracy: r.accuracy } : {}),
      ...(r.visit_time !== undefined ? { visit_time: r.visit_time } : {}),
      ...(r.notes !== undefined ? { notes: r.notes } : {}),
    });
  }

  if (schedulesToInsert.length > 0) {
    const unique = dedupeSchedules(schedulesToInsert);

    // Update existing records, insert new ones.
    // When updating, preserve status if already 'completed'.
    const keys = unique.map(
      (r) =>
        `${r.user_id}|${r.desa_id}|${r.visit_date}|${r.block_no ?? ""}|${r.no_plot ?? ""}|${r.member_name ?? ""}`,
    );
    const existingMap = new Map<string, { id: string; status: string }>();
    if (keys.length > 0) {
      const { data: existingRows } = await admin
        .from("schedules")
        .select("id, user_id, desa_id, visit_date, block_no, no_plot, member_name, status")
        .in("user_id", [...new Set(unique.map((r) => r.user_id))])
        .is("deleted_at", null);
      for (const row of existingRows ?? []) {
        const k = `${row.user_id}|${row.desa_id}|${row.visit_date}|${row.block_no ?? ""}|${row.no_plot ?? ""}|${row.member_name ?? ""}`;
        existingMap.set(k, { id: row.id, status: row.status });
      }
    }

    const toInsert: typeof schedulesToInsert = [];
    const toUpdate: Array<{ id: string; data: Record<string, unknown> }> = [];

    for (let i = 0; i < unique.length; i++) {
      const r = unique[i];
      const match = existingMap.get(keys[i]);
      if (match) {
        const { id, status: currentStatus } = match;
        const updateData: Record<string, unknown> = {};
        if (r.tgl_tanam !== undefined) updateData.tgl_tanam = r.tgl_tanam;
        if (r.cgr !== undefined) updateData.cgr = r.cgr;
        if (r.cgr_code !== undefined) updateData.cgr_code = r.cgr_code;
        if (r.block_no !== undefined) updateData.block_no = r.block_no;
        if (r.no_plot !== undefined) updateData.no_plot = r.no_plot;
        if (r.member_name !== undefined) updateData.member_name = r.member_name;
        if (r.document_no !== undefined) updateData.document_no = r.document_no;
        if (r.ph_tanah !== undefined) updateData.ph_tanah = r.ph_tanah;
        if (r.nis !== undefined) updateData.nis = r.nis;
        if (r.real_tanam_ha !== undefined) updateData.real_tanam_ha = r.real_tanam_ha;
        if (r.gagal_tanam !== undefined) updateData.gagal_tanam = r.gagal_tanam;
        if (r.sisa_di_lahan_ha !== undefined) updateData.sisa_di_lahan_ha = r.sisa_di_lahan_ha;
        if (r.tgl_panen !== undefined) updateData.tgl_panen = r.tgl_panen;
        if (r.latitude !== undefined) updateData.latitude = r.latitude;
        if (r.longitude !== undefined) updateData.longitude = r.longitude;
        if (r.accuracy !== undefined) updateData.accuracy = r.accuracy;
        if (r.visit_time !== undefined) updateData.visit_time = r.visit_time;
        if (r.notes !== undefined) updateData.notes = r.notes;
        // Jangan ubah status jika sudah completed
        if (currentStatus !== "completed") {
          updateData.status = "pending";
        }
        updateData.updated_at = new Date().toISOString();
        if (Object.keys(updateData).length > 1) {
          toUpdate.push({ id, data: updateData });
        }
      } else {
        toInsert.push(r);
      }
    }

    const { error: insertError } = await admin.from("schedules").insert(toInsert);
    if (insertError) {
      errors.push({ row: 0, message: `Gagal insert: ${insertError.message}` });
    } else {
      result.success = toInsert.length;
      result.duplicates = schedulesToInsert.length - unique.length;
    }

    let replaced = 0;
    if (toUpdate.length > 0) {
      const updates = toUpdate.map((u) =>
        admin.from("schedules").update(u.data).eq("id", u.id),
      );
      const updateResults = await Promise.all(updates);
      replaced = updateResults.filter((r) => !r.error).length;
      const updateErrors = updateResults.filter((r) => r.error).length;
      if (updateErrors > 0) {
        errors.push({ row: 0, message: `${updateErrors} jadwal gagal diupdate` });
      }
    }
    result.replaced = replaced;
  }
  result.errors = errors.length;
  result.errorRows = errors;
  result.created = { ...master.created, users: userOut.created };

  await admin
    .from("excel_imports")
    .update({
      success_rows: result.success,
      error_rows: result.errors,
      status: "completed",
      error_log: errors,
    })
    .eq("id", importRecord.id);

  await notifyImportCompleted(userId, result.success, result.errors, result.replaced ?? 0);

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

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseVisitTime(date: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  const timeMatch = raw.match(/(\d{1,2})[:.\s]?(\d{2})?/);
  if (!timeMatch) return null;
  const hh = timeMatch[1].padStart(2, "0");
  const mm = (timeMatch[2] ?? "00").padStart(2, "0");
  const iso = `${date}T${hh}:${mm}:00+00:00`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

function dedupeSchedules(
  rows: Array<{
    user_id: string;
    kabupaten_id: string;
    kecamatan_id: string;
    desa_id: string;
    visit_date: string;
    created_by: string;
    block_no?: string;
    no_plot?: string;
    member_name?: string;
  }>,
): typeof rows {
  const seen = new Set<string>();
  const result: typeof rows = [];
  for (const r of rows) {
    // A visit is unique per petugas + desa + tanggal + block + plot + member,
    // so distinct rows (different plot/member) are kept, not collapsed.
    const key =
      `${r.user_id}|${r.desa_id}|${r.visit_date}|${r.block_no ?? ""}|${r.no_plot ?? ""}|${r.member_name ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(r);
  }
  return result;
}
