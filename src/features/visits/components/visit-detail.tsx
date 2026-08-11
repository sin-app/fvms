"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, User, MapPin, CloudOff } from "lucide-react";
import { useVisitDetail } from "../hooks/use-visit";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { VisitStatusSelector } from "./visit-status-selector";
import { VisitLabel } from "./visit-label";
import { VisitNotesForm } from "./visit-notes-form";
import { VisitPhotos } from "./visit-photos";
import { VisitGps } from "./visit-gps";
import { VisitTimeline } from "./visit-timeline";
import { PanenCard } from "@/features/panen";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { useAuth } from "@/features/auth/components/auth-context";
import { useSync } from "@/lib/offline/sync-context";

interface VisitDetailProps {
  id: string;
}

export function VisitDetail({ id }: VisitDetailProps) {
  const { data, isLoading, refetch } = useVisitDetail(id);
  const { user } = useAuth();
  const { online } = useSync();
  const role = user?.role;
  const schedule = data?.schedule;

  if (isLoading && !data) return <LoadingState variant="card" />;
  if (!schedule) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">
          Kunjungan tidak ditemukan di penyimpanan lokal
        </p>
        <div className="flex items-center justify-center gap-2">
          <ErrorState onRetry={refetch} />
        </div>
        <Link href="/schedules">
          <Button variant="outline">Kembali ke Jadwal</Button>
        </Link>
      </div>
    );
  }

  const notes = data?.notes ?? null;
  const photos = data?.photos ?? [];

  const isOwner = schedule.user_id === user?.id;
  const canEdit = role === "admin" || role === "qc" || isOwner;
  const canLabel = role === "admin" || role === "qc";

  return (
    <div className="space-y-6">
      {!online && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <CloudOff className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Luring — menampilkan data tersimpan terakhir. Perubahan disimpan lokal dan
            disinkronkan otomatis saat koneksi pulih.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/schedules"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <VisitStatusSelector scheduleId={id} currentStatus={schedule.status} editable={canEdit} />
          <VisitLabel scheduleId={id} currentLabel={schedule.label} editable={canLabel && online} />
        </div>
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
                  <p className="text-xs text-muted-foreground">Produksi</p>
                  <p className="text-sm font-medium">{schedule.users?.name ?? "—"}</p>
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

            <div className="flex flex-wrap gap-4">
              {schedule.gagal_tanam != null && (
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Gagal Tanam</span>
                  <p className="font-medium text-orange-600">{schedule.gagal_tanam} Ha</p>
                </div>
              )}
              {schedule.sisa_di_lahan_ha != null && (
                <div className="text-sm">
                  <span className="text-xs text-muted-foreground">Sisa di Lahan</span>
                  <p className="font-medium">{schedule.sisa_di_lahan_ha} Ha</p>
                </div>
              )}
            </div>

            {schedule.visit_time && (
              <div className="text-xs text-muted-foreground">
                Waktu kunjungan: {formatDateTime(schedule.visit_time)}
              </div>
            )}
          </div>

          <PanenCard
            scheduleId={id}
            tglPanen={schedule.tgl_panen}
            panenKeterangan={schedule.panen_keterangan}
            editable={canEdit && online}
          />

          <div className="rounded-xl border p-5">
            <h2 className="text-lg font-semibold mb-4">Catatan Kunjungan</h2>
            <VisitNotesForm scheduleId={id} defaultValues={notes} editable={canEdit} />
          </div>

          <div className="rounded-xl border p-5">
            <VisitPhotos
              scheduleId={id}
              photos={photos}
              onDelete={() => {}}
              deleting={false}
              editable={canEdit}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <VisitGps
              scheduleId={id}
              currentStatus={schedule.status}
              currentLatitude={schedule.latitude}
              currentLongitude={schedule.longitude}
              currentAccuracy={schedule.accuracy}
              editable={canEdit}
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
