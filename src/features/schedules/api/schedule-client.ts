"use server";

import { getAuthContext, canAccessSchedule } from "@/lib/auth/authorization";
import { getScheduleList, getScheduleById, getCalendarEvents, getDistinctCgr } from "../services/schedule-service";
import type { ScheduleFilters } from "../types";

export async function fetchScheduleList(filters: ScheduleFilters) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const userId = ctx.role === "admin" || ctx.role === "qc" ? "all" : ctx.userId;

  return getScheduleList(userId, filters, ctx);
}

export async function fetchScheduleById(id: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");
  if (!(await canAccessSchedule(id, ctx))) return null;
  return getScheduleById(id);
}

export async function fetchCalendarEvents(start: string, end: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const userId = ctx.role === "admin" || ctx.role === "qc" ? "all" : ctx.userId;

  return getCalendarEvents(userId, start, end, ctx);
}

export async function fetchDistinctCgr(): Promise<string[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const userId = ctx.role === "admin" || ctx.role === "qc" ? "all" : ctx.userId;

  return getDistinctCgr(userId, ctx);
}
