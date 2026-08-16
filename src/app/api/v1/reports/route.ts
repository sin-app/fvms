import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { todayString } from "@/lib/utils/date";
import { nextErrorResponse } from "@/lib/errors";
import { preflightResponse, withCors } from "@/lib/cors";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return preflightResponse(request);
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateApiKey(request);
    if (!auth.authenticated) {
      return withCors(request, NextResponse.json({ error: auth.error }, { status: auth.status }));
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    if (!dateFrom || !dateTo) {
      return withCors(
        request,
        NextResponse.json({ error: "date_from and date_to are required" }, { status: 400 }),
      );
    }

    const admin = createAdminClient();

    const { data: apiUser } = await admin
      .from("users")
      .select("role, assigned_kabupaten_ids")
      .eq("id", auth.userId)
      .maybeSingle();

    const role = (apiUser?.role ?? "produksi") as "admin" | "qc" | "produksi";
    const kabScope =
      role === "qc" && Array.isArray(apiUser?.assigned_kabupaten_ids)
        ? (apiUser.assigned_kabupaten_ids as string[])
        : null;

    let query = admin
      .from("schedules")
      .select("id, status, visit_date, kabupaten_id, user_id", { count: "exact" })
      .is("deleted_at", null)
      .gte("visit_date", dateFrom)
      .lte("visit_date", dateTo);

    if (kabScope !== null) {
      query = query.in("kabupaten_id", kabScope.length > 0 ? kabScope : ["__none__"]);
    } else if (role !== "admin") {
      query = query.eq("user_id", auth.userId);
    }

    const kabupatenId = searchParams.get("kabupaten_id");
    if (kabupatenId && kabScope === null) query = query.eq("kabupaten_id", kabupatenId);

    const userId = searchParams.get("user_id");
    if (userId && kabScope === null && role === "admin") query = query.eq("user_id", userId);

    const { data, count, error } = await query;

    if (error) {
      return withCors(
        request,
        NextResponse.json({ error: "Gagal memuat data laporan" }, { status: 500 }),
      );
    }

    const total = count ?? 0;
    const completed = data?.filter((s) => s.status === "completed").length ?? 0;
    const gagal_total = data?.filter((s) => s.status === "gagal_total").length ?? 0;
    const pending = data?.filter((s) => s.status === "pending").length ?? 0;
    const in_progress = data?.filter((s) => s.status === "in_progress").length ?? 0;
    const today = todayString();
    const late_count =
      data?.filter(
        (s) =>
          s.visit_date < today &&
          !["completed", "gagal_partial", "gagal_total"].includes(s.status),
      ).length ?? 0;

    return withCors(
      request,
      NextResponse.json({
        data: {
          total_schedules: total,
          completed,
          gagal_total,
          pending,
          in_progress,
          late_count,
          completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      }),
    );
  } catch (err) {
    return withCors(request, nextErrorResponse(err));
  }
}
