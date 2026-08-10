"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CloudOff, Calendar, MapPin, User, FileText, Camera } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { LabelBadge } from "@/components/shared/label-badge";
import { formatDate } from "@/lib/utils/date";
import type { VisitStatus } from "@/types";
import {
  offlinePhotoObjectUrl,
  type OfflineVisitDetail,
} from "../services/visit-client";

export function OfflineVisitView({ detail }: { detail: OfflineVisitDetail }) {
  const { schedule, notes, photos } = detail;
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = photos
      .map((p) => offlinePhotoObjectUrl(p))
      .filter((u): u is string => !!u);
    const t = setTimeout(() => setPhotoUrls(urls), 0);
    return () => {
      clearTimeout(t);
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  if (!schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Data kunjungan tidak tersedia offline</p>
        <Link href="/schedules">
          <span className="inline-flex mt-4 text-sm text-brand hover:underline">Kembali ke Jadwal</span>
        </Link>
      </div>
    );
  }

  const region = (v: string | null | undefined) => v ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/schedules"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={(schedule.status ?? "pending") as VisitStatus} />
          <LabelBadge label={schedule.label} />
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <CloudOff className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Luring — menampilkan data tersimpan terakhir. Edit catatan, foto, dan GPS aktif kembali setelah sinkron.</span>
      </div>

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
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Member</p>
              <p className="text-sm font-medium">{schedule.member_name ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:col-span-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Lokasi</p>
              <p className="text-sm font-medium">
                {region(schedule.kabupaten_name)} · {region(schedule.kecamatan_name)} · {region(schedule.desa_name)}
              </p>
            </div>
          </div>
          {(schedule.document_no || schedule.nis || schedule.block_no || schedule.no_plot || schedule.cgr) && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="text-xs text-muted-foreground mb-1">Identitas Lahan</p>
                <p className="font-medium">
                  {[schedule.document_no, schedule.nis, schedule.cgr, schedule.block_no && `Block ${schedule.block_no}`, schedule.no_plot && `Plot ${schedule.no_plot}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {notes && (notes.observation || notes.problem || notes.recommend || notes.additional) && (
        <div className="rounded-xl border p-5 space-y-3">
          <h2 className="text-lg font-semibold">Catatan Kunjungan</h2>
          {[
            { label: "Observasi", value: notes.observation },
            { label: "Masalah", value: notes.problem },
            { label: "Rekomendasi", value: notes.recommend },
            { label: "Tambahan", value: notes.additional },
          ]
            .filter((n) => n.value)
            .map((n) => (
              <div key={n.label}>
                <p className="text-xs text-muted-foreground">{n.label}</p>
                <p className="text-sm whitespace-pre-wrap">{n.value}</p>
              </div>
            ))}
        </div>
      )}

      {photoUrls.length > 0 && (
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Foto Kunjungan</h2>
            <span className="text-xs text-muted-foreground">({photos.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative aspect-square w-full rounded-lg border overflow-hidden">
                <Image
                  src={url}
                  alt={`Foto kunjungan ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}