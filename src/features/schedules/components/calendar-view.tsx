"use client";

import { useMemo, useState } from "react";
import { useCalendarEvents } from "../hooks/use-calendar";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { STATUS_LABELS } from "@/lib/constants/status";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

export function CalendarView() {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(today);

  const start = useMemo(
    () => format(currentDate, "yyyy-MM-01"),
    [currentDate],
  );
  const end = useMemo(
    () => {
      const next = new Date(currentDate);
      next.setMonth(next.getMonth() + 1);
      return format(next, "yyyy-MM-01");
    },
    [currentDate],
  );

  const { data: events, isLoading, isError, refetch } = useCalendarEvents(start, end);

  const calendarDays = useMemo(() => {
    if (!events) return [];
    const daysMap = new Map<string, typeof events>();

    events.forEach((event) => {
      const existing = daysMap.get(event.start) ?? [];
      existing.push(event);
      daysMap.set(event.start, existing);
    });

    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();

    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    ).getDay();

    const days: { date: Date; events: typeof events; isCurrentMonth: boolean }[] = [];

    for (let i = 0; i < firstDay; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0 - (firstDay - 1 - i));
      days.push({ date: d, events: [], isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const key = format(d, "yyyy-MM-dd");
      days.push({ date: d, events: daysMap.get(key) ?? [], isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date: d, events: [], isCurrentMonth: false });
    }

    return days;
  }, [events, currentDate]);

  function navigate(direction: "prev" | "next") {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(d);
  }

  if (isLoading) return <LoadingState variant="card" />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy", { locale: id })}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border">
            <button
              onClick={() => navigate("prev")}
              className="px-3 py-1.5 text-sm hover:bg-muted transition-colors rounded-l-lg"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(today)}
              className="px-3 py-1.5 text-sm hover:bg-muted transition-colors border-x"
            >
              Hari Ini
            </button>
            <button
              onClick={() => navigate("next")}
              className="px-3 py-1.5 text-sm hover:bg-muted transition-colors rounded-r-lg"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/50">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={`min-h-[100px] p-1.5 border-t border-r ${
                !day.isCurrentMonth ? "bg-muted/20" : ""
              } ${
                format(day.date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
                  ? "bg-primary/5"
                  : ""
              }`}
            >
              <div className="text-xs font-medium mb-1">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    format(day.date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {format(day.date, "d")}
                </span>
              </div>
              <div className="space-y-0.5">
                {day.events.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/visits/${event.id}`}
                    className="block text-xs px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: event.backgroundColor }}
                    title={`${event.extendedProps.kecamatan} - ${event.extendedProps.desa} (${STATUS_LABELS[event.extendedProps.status as keyof typeof STATUS_LABELS] ?? event.extendedProps.status})`}
                  >
                    {event.title}
                  </Link>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{day.events.length - 3} lainnya
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
