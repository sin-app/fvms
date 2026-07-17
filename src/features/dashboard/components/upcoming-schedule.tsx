"use client";

import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateShort } from "@/lib/utils/date";
import type { Schedule } from "@/types";

interface UpcomingScheduleProps {
  schedules: Schedule[];
}

export function UpcomingSchedule({ schedules }: UpcomingScheduleProps) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Jadwal Mendatang</h2>
        </div>
        <EmptyState
          title="Tidak ada jadwal"
          description="Belum ada jadwal kunjungan mendatang"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Jadwal Mendatang</h2>
      </div>
      <div className="divide-y">
        {schedules.map((schedule) => (
          <Link
            key={schedule.id}
            href={`/visits/${schedule.id}`}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {(schedule as unknown as { kecamatan?: { name: string } }).kecamatan?.name ?? "—"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDateShort(schedule.visit_date)}</span>
                <span>·</span>
                <span>{(schedule as unknown as { kabupaten?: { name: string } }).kabupaten?.name ?? "—"}</span>
              </div>
            </div>
            <StatusBadge status={schedule.status} size="sm" />
          </Link>
        ))}
      </div>
      {schedules.length >= 5 && (
        <Link
          href="/schedules"
          className="flex items-center justify-center gap-1 p-3 text-sm text-muted-foreground hover:text-primary border-t"
        >
          Lihat semua
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
