"use client";

import { useLocalQuery } from "@/lib/offline/use-local-query";
import { loadOfflineScheduleRows } from "../services/offline-read";
import type { ScheduleFilters, CalendarEvent } from "../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#8b5cf6",
  completed: "#22c55e",
  gagal_total: "#ef4444",
};

export function useCalendarEvents(start: string, end: string) {
  return useLocalQuery<CalendarEvent[]>({
    queryKey: ["calendar", start, end],
    queryFn: async () => {
      const filters: ScheduleFilters = { date_from: start, date_to: end };
      const schedules = await loadOfflineScheduleRows(filters);
      return transformToCalendarEvents(schedules);
    },
  });
}

function transformToCalendarEvents(
  schedules: import("@/types").Schedule[],
): CalendarEvent[] {
  return schedules.map((s) => {
    const color = STATUS_COLORS[s.status] ?? "#6b7280";
    const kab = (s as unknown as { kabupaten?: { name: string } }).kabupaten?.name ?? "";
    const kec = (s as unknown as { kecamatan?: { name: string } }).kecamatan?.name ?? "";
    const des = (s as unknown as { desa?: { name: string } }).desa?.name ?? "";

    return {
      id: s.id,
      title: `${kec} - ${des}`,
      start: s.visit_date,
      backgroundColor: color,
      borderColor: color,
      textColor: "#ffffff",
      extendedProps: {
        status: s.status,
        kabupaten: kab,
        kecamatan: kec,
        desa: des,
      },
    };
  });
}
