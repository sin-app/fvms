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
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "date_from and date_to are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("schedules")
    .select("id, status, visit_date, kabupaten_id, user_id", { count: "exact" })
    .is("deleted_at", null)
    .gte("visit_date", dateFrom)
    .lte("visit_date", dateTo);

  const kabupatenId = searchParams.get("kabupaten_id");
  if (kabupatenId) query = query.eq("kabupaten_id", kabupatenId);

  const userId = searchParams.get("user_id");
  if (userId) query = query.eq("user_id", userId);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count ?? 0;
  const completed = data?.filter((s) => s.status === "completed").length ?? 0;
  const cancelled = data?.filter((s) => s.status === "cancelled").length ?? 0;
  const pending = data?.filter((s) => s.status === "pending").length ?? 0;
  const on_the_way = data?.filter((s) => s.status === "on_the_way").length ?? 0;
  const in_progress = data?.filter((s) => s.status === "in_progress").length ?? 0;
  const today = new Date().toISOString().split("T")[0];
  const late_count = data?.filter(
    (s) => s.visit_date < today && !["completed", "cancelled"].includes(s.status),
  ).length ?? 0;

  return NextResponse.json({
    data: {
      total_schedules: total,
      completed,
      cancelled,
      pending,
      on_the_way,
      in_progress,
      late_count,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
  });
}
