import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { generateDueSoonNotifications } from "@/features/notifications/services/notification-service";
import { sendPushNotifications } from "@/lib/push-sender";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function bearerMatches(auth: string | null, secret: string): boolean {
  if (!auth) return false;
  const expected = `Bearer ${secret}`;
  // Bandingkan hash agar panjang sama (timingSafeEqual butuh panjang identik).
  const a = crypto.createHash("sha256").update(auth).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("Cron disabled: CRON_SECRET tidak diset");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (!bearerMatches(auth, secret)) {
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
