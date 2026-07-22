import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("users").select("id").limit(1).maybeSingle();
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  const degraded = Object.values(checks).some((c) => c === "error");
  return NextResponse.json(
    { status: degraded ? "degraded" : "ok", checks },
    { status: degraded ? 503 : 200 },
  );
}
