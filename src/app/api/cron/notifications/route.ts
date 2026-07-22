import { NextResponse } from "next/server";
import { generateDueSoonNotifications } from "@/features/notifications/services/notification-service";
import { sendPushNotifications } from "@/lib/push-sender";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await generateDueSoonNotifications();
    let pushSent = 0;
    if (count > 0) {
      pushSent = await sendPushNotifications({
        title: "Jadwal Mendatang",
        body: `${count} jadwal kunjungan mendekati tenggat. Cek jadwal Anda.`,
        url: "/schedules",
      });
    }
    return NextResponse.json({ ok: true, created: count, pushSent });
  } catch (error) {
    logger.error("Cron notifications failed", { error: String(error) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
