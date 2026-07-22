import { NextResponse } from "next/server";
import { generateDueSoonNotifications } from "@/features/notifications/services/notification-service";
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
    return NextResponse.json({ ok: true, created: count });
  } catch (error) {
    logger.error("Cron notifications failed", { error: String(error) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
