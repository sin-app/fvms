import { createAdminClient } from "@/lib/supabase/admin-client";
import { logger } from "@/lib/logger";

export interface ResetResult {
  schedulesDeleted: number;
  activityLogsDeleted: number;
  produksiUsersDeleted: number;
}

/**
 * Wipe all operational data while keeping admin and qc users, plus master data
 * (kabupaten/kecamatan/desa are recreated on the next import). Used before a
 * fresh "import ulang".
 */
export async function resetAllData(): Promise<ResetResult> {
  const admin = createAdminClient();

  // 0) Ambil semua path foto sebelum schedule dihapus, lalu bersihkan storage
  //    (private bucket) supaya tidak ada objek yatim setelah reset.
  const { data: photoRows } = await admin
    .from("visit_photos")
    .select("url");
  const paths = (photoRows ?? []).map((p) => p.url).filter(Boolean) as string[];
  if (paths.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < paths.length; i += chunkSize) {
      const chunk = paths.slice(i, i + chunkSize);
      try {
        await admin.storage.from("visit-photos").remove(chunk);
      } catch (err) {
        logger.error("[reset-service] Gagal hapus foto storage", { error: String(err) });
      }
    }
  }

  // 1) Hard-delete all schedules. Cascades to visit_photos and visit_notes.
  const { count: schedCount } = await admin
    .from("schedules")
    .select("id", { count: "exact", head: true });
  const { error: schedErr } = await admin
    .from("schedules")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (schedErr) throw new Error(`Gagal hapus jadwal: ${schedErr.message}`);

  // 2) Hard-delete all activity logs.
  const { count: logCount } = await admin
    .from("activity_logs")
    .select("id", { count: "exact", head: true });
  const { error: logErr } = await admin
    .from("activity_logs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (logErr) throw new Error(`Gagal hapus log: ${logErr.message}`);

  // 3) Delete all produksi users (their auth accounts + db rows).
  const { data: produksiUsers, error: userErr } = await admin
    .from("users")
    .select("id")
    .eq("role", "produksi");
  if (userErr) throw new Error(`Gagal ambil user produksi: ${userErr.message}`);

  let deletedUsers = 0;
  const orphaned: string[] = [];
  for (const u of produksiUsers ?? []) {
    let authDeleted = false;
    try {
      const { error: authErr } = await admin.auth.admin.deleteUser(u.id);
      if (!authErr) authDeleted = true;
    } catch {
      // ignore if no auth account
    }
    const { error: delErr } = await admin.from("users").delete().eq("id", u.id);
    if (!delErr) {
      deletedUsers += 1;
      if (!authDeleted) orphaned.push(u.id);
    }
  }
  if (orphaned.length > 0) {
    logger.error("[reset-service] Orphaned auth accounts (DB row deleted, auth survives)", { orphaned: orphaned.join(", ") });
  }

  // 4) Clear previous import records for a clean slate.
  await admin
    .from("excel_imports")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  return {
    schedulesDeleted: schedCount ?? 0,
    activityLogsDeleted: logCount ?? 0,
    produksiUsersDeleted: deletedUsers,
  };
}
