"use server";

import { revalidatePath } from "next/cache";
import { parseExcelFile, getFullData, bulkImportSchedules } from "../services/import-service";
import { columnMappingSchema } from "../schema/import-schema";
import type { ColumnMapping, ImportPreview } from "../types";
import { getAuthContext, isPrivileged } from "@/lib/auth/authorization";
import { MAX_EXCEL_ROWS, MAX_EXCEL_BASE64_LENGTH } from "@/lib/constants/import";

export async function previewExcelFileAction(fileBase64: string): Promise<{
  success: boolean;
  data?: ImportPreview;
  error?: string;
}> {
  if (!fileBase64 || fileBase64.length > MAX_EXCEL_BASE64_LENGTH) {
    return { success: false, error: "File terlalu besar (maksimal 10MB)" };
  }

  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const preview = await parseExcelFile(buffer);
    if (preview.totalRows > MAX_EXCEL_ROWS) {
      return { success: false, error: `Jumlah baris melebihi batas maksimal (${MAX_EXCEL_ROWS})` };
    }
    return { success: true, data: preview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membaca file";
    return { success: false, error: msg };
  }
}

export async function executeImportAction(
  prevState: { success: boolean; error?: string; data?: { id: string; success: number; errors: number } },
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: { id: string; success: number; errors: number } }> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (!isPrivileged(ctx.role)) {
    return { success: false, error: "Hanya admin/supervisor yang dapat mengimport" };
  }

  const fileBase64 = formData.get("file") as string;
  const mappingJson = formData.get("mapping") as string;

  if (!fileBase64 || !mappingJson) {
    return { success: false, error: "Data tidak lengkap" };
  }

  if (fileBase64.length > MAX_EXCEL_BASE64_LENGTH) {
    return { success: false, error: "File terlalu besar (maksimal 10MB)" };
  }

  const parsedMapping = columnMappingSchema.safeParse(JSON.parse(mappingJson));
  if (!parsedMapping.success) {
    return { success: false, error: "Mapping kolom tidak valid" };
  }

  const requiredKeys = ["user_name", "kabupaten_name", "kecamatan_name", "desa_name", "visit_date"];
  const mapping = parsedMapping.data as ColumnMapping;
  const missing = requiredKeys.filter((k) => !mapping[k]);
  if (missing.length > 0) {
    return { success: false, error: `Mapping kolom tidak lengkap: ${missing.join(", ")}` };
  }

  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const data = await getFullData(buffer);
    const result = await bulkImportSchedules(data, mapping, ctx.userId);
    revalidatePath("/schedules");
    return {
      success: true,
      data: { id: result.id, success: result.success, errors: result.errors },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal import";
    return { success: false, error: msg };
  }
}
