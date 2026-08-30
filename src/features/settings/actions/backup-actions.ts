"use server";

import { createBackupExport, restoreFromBackup } from "../services/backup-service";
import { requireAdmin } from "@/lib/auth/authorization";

export async function exportBackupAction(): Promise<{
  success: boolean;
  error?: string;
  data?: string;
  filename?: string;
}> {
  await requireAdmin();
  try {
    const { json, filename } = await createBackupExport();
    return { success: true, data: json, filename };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal membuat backup" };
  }
}

export async function importBackupAction(
  _prev: { success: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("File backup wajib dipilih");
    const json = await file.text();
    await restoreFromBackup(json);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal import backup" };
  }
}
