"use server";

import { createClient } from "@/lib/supabase/server-client";
import { getScheduleList, getScheduleById, getCalendarEvents } from "../services/schedule-service";
import type { ScheduleFilters } from "../types";

export async function fetchScheduleList(filters: ScheduleFilters) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined;
  const userId = role === "admin" || role === "supervisor" ? "all" : user.id;

  return getScheduleList(userId, filters);
}

export async function fetchScheduleById(id: string) {
  return getScheduleById(id);
}

export async function fetchCalendarEvents(start: string, end: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const role = (user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined;
  const userId = role === "admin" || role === "supervisor" ? "all" : user.id;

  return getCalendarEvents(userId, start, end);
}
