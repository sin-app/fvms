import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = createAdminClient();
  let query = admin
    .from("schedules")
    .select("id, visit_date, status, kabupaten_id, kecamatan_id, desa_id, member_name, block_no, no_plot, nis, created_at, updated_at, user_id", { count: "exact" })
    .is("deleted_at", null)
    .order("visit_date", { ascending: false })
    .range(from, to);

  const status = searchParams.get("status");
  if (status) query = query.eq("status", status);

  const kabupatenId = searchParams.get("kabupaten_id");
  if (kabupatenId) query = query.eq("kabupaten_id", kabupatenId);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: count ? Math.ceil(count / limit) : 0,
    },
  });
}
