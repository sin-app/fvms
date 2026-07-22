"use client";

import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Schedule } from "@/types";

interface TodayScheduleProps {
  schedules: Schedule[];
}

export function TodaySchedule({ schedules }: TodayScheduleProps) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Jadwal Hari Ini</h2>
        </div>
        <EmptyState
          title="Tidak ada jadwal"
          description="Tidak ada kunjungan terjadwal hari ini"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Jadwal Hari Ini</h2>
        <span className="text-sm text-muted-foreground">{schedules.length} kunjungan</span>
      </div>
      <div className="divide-y">
        {schedules.slice(0, 5).map((schedule) => (
          <Link
            key={schedule.id}
            href={`/visits/${schedule.id}`}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
          >
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {(schedule as unknown as { kecamatan?: { name: string } }).kecamatan?.name ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {(schedule as unknown as { desa?: { name: string } }).desa?.name ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground/70 truncate">
                Petugas: {(schedule as unknown as { users?: { name: string } }).users?.name ?? "—"}
              </p>
            </div>
            <StatusBadge status={schedule.status} size="sm" />
          </Link>
        ))}
      </div>
      {schedules.length > 5 && (
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
