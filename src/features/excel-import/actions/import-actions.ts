"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { parseExcelFile, getFullData, bulkImportSchedules } from "../services/import-service";
import type { ColumnMapping, ImportPreview } from "../types";

export async function previewExcelFileAction(fileBase64: string): Promise<{
  success: boolean;
  data?: ImportPreview;
  error?: string;
}> {
  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const preview = await parseExcelFile(buffer);
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const fileBase64 = formData.get("file") as string;
  const mappingJson = formData.get("mapping") as string;

  if (!fileBase64 || !mappingJson) {
    return { success: false, error: "Data tidak lengkap" };
  }

  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const mapping: ColumnMapping = JSON.parse(mappingJson);
    const data = await getFullData(buffer);
    const result = await bulkImportSchedules(data, mapping, user.id);
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
