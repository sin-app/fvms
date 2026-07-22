import { createAdminClient } from "@/lib/supabase/admin-client";

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
  for (const u of produksiUsers ?? []) {
    try {
      await admin.auth.admin.deleteUser(u.id);
    } catch {
      // ignore if no auth account
    }
    const { error: delErr } = await admin.from("users").delete().eq("id", u.id);
    if (!delErr) deletedUsers += 1;
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
