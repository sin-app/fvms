"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCalendarEvents } from "../api/schedule-client";
import type { CalendarEvent } from "../types";
import type { Schedule } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  on_the_way: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

export function useCalendarEvents(start: string, end: string) {
  return useQuery({
    queryKey: ["calendar", start, end],
    queryFn: async () => {
      const schedules = await fetchCalendarEvents(start, end);
      return transformToCalendarEvents(schedules);
    },
  });
}

function transformToCalendarEvents(schedules: Schedule[]): CalendarEvent[] {
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
