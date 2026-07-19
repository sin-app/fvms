"use server";

import { getAuthContext } from "@/lib/auth/authorization";
import { getScheduleList, getScheduleById, getCalendarEvents } from "../services/schedule-service";
import type { ScheduleFilters } from "../types";

export async function fetchScheduleList(filters: ScheduleFilters) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const userId = ctx.role === "admin" || ctx.role === "qc" ? "all" : ctx.userId;

  return getScheduleList(userId, filters);
}

export async function fetchScheduleById(id: string) {
  return getScheduleById(id);
}

export async function fetchCalendarEvents(start: string, end: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Not authenticated");

  const userId = ctx.role === "admin" || ctx.role === "qc" ? "all" : ctx.userId;

  return getCalendarEvents(userId, start, end);
}
