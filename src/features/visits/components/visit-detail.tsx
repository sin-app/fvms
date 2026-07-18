"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, User, MapPin } from "lucide-react";
import { useVisitDetail, useDeletePhoto } from "../hooks/use-visit";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { VisitStatusSelector } from "./visit-status-selector";
import { VisitNotesForm } from "./visit-notes-form";
import { VisitPhotos } from "./visit-photos";
import { VisitGps } from "./visit-gps";
import { VisitTimeline } from "./visit-timeline";
import { formatDate, formatDateTime } from "@/lib/utils/date";

interface VisitDetailProps {
  id: string;
}

export function VisitDetail({ id }: VisitDetailProps) {
  const { data: schedule, isLoading, isError, refetch } = useVisitDetail(id);
  const deletePhoto = useDeletePhoto();

  if (isLoading) return <LoadingState variant="card" />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Kunjungan tidak ditemukan</p>
        <Link href="/schedules">
          <Button variant="outline" className="mt-4">Kembali ke Jadwal</Button>
        </Link>
      </div>
    );
  }

  const notes = Array.isArray(schedule.visit_notes)
    ? schedule.visit_notes[0]
    : schedule.visit_notes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/schedules"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <VisitStatusSelector scheduleId={id} currentStatus={schedule.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border p-5 space-y-4">
            <h2 className="text-lg font-semibold">Detail Kunjungan</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="text-sm font-medium">{formatDate(schedule.visit_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <StatusBadge status={schedule.status} />
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Petugas</p>
                  <p className="text-sm font-medium">{schedule.user?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="text-sm font-medium">
                    {schedule.kabupaten?.name ?? "—"} &gt; {schedule.kecamatan?.name ?? "—"} &gt; {schedule.desa?.name ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {schedule.visit_time && (
              <div className="text-xs text-muted-foreground">
                Waktu kunjungan: {formatDateTime(schedule.visit_time)}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="text-lg font-semibold mb-4">Catatan Kunjungan</h2>
            <VisitNotesForm scheduleId={id} defaultValues={notes} />
          </div>

          <div className="rounded-xl border p-5">
            <VisitPhotos
              scheduleId={id}
              photos={schedule.visit_photos ?? []}
              onDelete={(photoId) => deletePhoto.mutate({ photo_id: photoId, schedule_id: id })}
              deleting={deletePhoto.isPending}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <VisitGps
              scheduleId={id}
              currentLatitude={schedule.latitude}
              currentLongitude={schedule.longitude}
              currentAccuracy={schedule.accuracy}
            />
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="text-sm font-medium mb-4">Aktivitas</h3>
            <VisitTimeline scheduleId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
