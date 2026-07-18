import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  out.serviceKeyLen = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("users")
      .select("id, email, role")
      .limit(2);
    out.adminData = data;
    out.adminError = error;
  } catch (e) {
    out.adminThrow = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(out);
}
