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
    .select("user_id, visit_date, document_no, member_name")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate)
    .neq("status", "completed")
    .is("deleted_at", null);

  if (!due || due.length === 0) return 0;

  const created = await Promise.all(
    (due as DueSoonSchedule[]).map(async (s) => {
      const label = s.document_no ?? s.member_name ?? "jadwal kunjungan";
      const msg = `Kunjungan ${label} jatuh pada ${s.visit_date}. Segera lakukan survei lapangan.`;
      await createNotification({
        userId: s.user_id,
        title: "Jadwal akan datang",
        message: msg,
        type: "info",
        link: "/schedules",
      });
      return 1;
    }),
  );

  return created.reduce((a, b) => a + b, 0);
}
