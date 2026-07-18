import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  out.hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  out.serviceKeyLen = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("users")
      .select("id, email, role")
      .eq("id", "04edd1cf-8eec-47cc-86f1-661a8286a480")
      .maybeSingle();
    out.adminData = data;
    out.adminError = error;
  } catch (e) {
    out.adminThrow = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(out);
}
