"use server";

import { getAuthContext } from "@/lib/auth/authorization";
import { getDashboardData } from "../services/dashboard-service";
import type { DashboardFilters } from "../types";

export async function fetchDashboardData(filters?: DashboardFilters) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const userId = ctx.role === "admin" || ctx.role === "qc" ? "all" : ctx.userId;

  return getDashboardData(userId, ctx, filters);
}
