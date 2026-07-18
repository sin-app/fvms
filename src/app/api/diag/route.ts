import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const admin = createAdminClient();
    const id = crypto.randomUUID();
    const { data, error } = await admin
      .from("kabupaten")
      .insert({ id, name: "DIAGKAB", code: "KAB-DIAG1", is_active: true })
      .select("id, name");
    out.insertData = data;
    out.insertError = error;
    out.hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (e) {
    out.throw = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(out);
}
