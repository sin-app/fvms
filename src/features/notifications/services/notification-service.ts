import { createAdminClient } from "@/lib/supabase/admin-client";
import { logger } from "@/lib/logger";
import type { NotificationType } from "@/types";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
    link: input.link ?? null,
  });
  if (error) {
    logger.error("Failed to create notification", {
      userId: input.userId,
      error: error.message,
    });
  }
}

export async function notifyImportCompleted(
  userId: string,
  success: number,
  errors: number,
  replaced: number,
): Promise<void> {
  const parts: string[] = [`${success} jadwal baru`];
  if (replaced > 0) parts.push(`${replaced} diperbarui`);
  if (errors > 0) parts.push(`${errors} baris gagal`);

  await createNotification({
    userId,
    title: "Impor selesai",
    message: parts.join(", "),
    type: errors > 0 ? "warning" : "success",
    link: "/schedules",
  });
}

interface DueSoonSchedule {
  id: string;
  user_id: string;
  visit_date: string;
  document_no: string | null;
  member_name: string | null;
}

export async function generateDueSoonNotifications(): Promise<number> {
  const admin = createAdminClient();
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 3);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const { data: due } = await admin
    .from("schedules")
    .select("id, user_id, visit_date, document_no, member_name")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate)
    .neq("status", "completed")
    .is("deleted_at", null);

  if (!due || due.length === 0) return 0;

  // Dedup: kirim 1 notifikasi per jadwal per hari. Cegah notifikasi
  // berulang pada window +1..+3 hari yang tumpang tindih antar cron run.
  const { data: existing } = await admin
    .from("notifications")
    .select("link")
    .eq("type", "info")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const seenLinks = new Set(existing?.map((n) => n.link).filter(Boolean) ?? []);
  const dueSchedules = due as (DueSoonSchedule & { id: string })[];

  const pending = dueSchedules
    .map((s) => ({
      userId: s.user_id,
      link: `/schedules?focus=${s.id}`,
      label: s.document_no ?? s.member_name ?? "jadwal kunjungan",
      visitDate: s.visit_date,
    }))
    .filter((n) => !seenLinks.has(n.link));

  if (pending.length === 0) return 0;

  const created = await Promise.all(
    pending.map(async (n) => {
      const msg = `Kunjungan ${n.label} jatuh pada ${n.visitDate}. Segera lakukan survei lapangan.`;
      await createNotification({
        userId: n.userId,
        title: "Jadwal akan datang",
        message: msg,
        type: "info",
        link: n.link,
      });
      return 1;
    }),
  );

  return created.reduce((a, b) => a + b, 0);
}
