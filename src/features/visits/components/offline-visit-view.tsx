"use client";

import { STATUS_VALUES } from "@/lib/constants/status";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { ArrowLeft, CloudOff, Calendar, MapPin, User, FileText, Camera, X, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { LabelBadge } from "@/components/shared/label-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import type { VisitNotes, VisitStatus } from "@/types";
import { VisitStatusSelector } from "./visit-status-selector";
import { VisitNotesForm } from "./visit-notes-form";
import { VisitGps } from "./visit-gps";
import {
  offlinePhotoObjectUrl,
  queuePhotoUpload,
  queuePhotoDelete,
  type OfflineVisitDetail,
} from "../services/visit-client";
import type { OfflineVisitPhoto } from "@/lib/offline/db";

interface OfflineVisitViewProps {
  detail: OfflineVisitDetail;
  editable?: boolean;
}

export function OfflineVisitView({ detail, editable = false }: OfflineVisitViewProps) {
  const { schedule, notes } = detail;
  const [photos, setPhotos] = useState<OfflineVisitPhoto[]>(detail.photos);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const hasFinalStatus = schedule.status === STATUS_VALUES.completed || schedule.status === STATUS_VALUES.gagal_total;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !schedule) return;
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const toUpload = compressed.size > 0 ? compressed : file;
      const photo = await queuePhotoUpload({
        scheduleId: schedule.id,
        blob: toUpload,
        mimeType: toUpload.type || "image/jpeg",
      });
      setPhotos((prev) => [...prev, photo]);
      toast.success("Foto tersimpan (luring) — akan disinkronkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses foto");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDeletePhoto(photo: OfflineVisitPhoto) {
    if (!schedule) return;
    try {
      await queuePhotoDelete(photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success("Foto dihapus (luring) — akan disinkronkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus foto");
    }
  }

  const notesDefault = notes
    ? ({
        id: schedule.id,
        schedule_id: schedule.id,
        observation: notes.observation,
        problem: notes.problem,
        recommend: notes.recommend,
        additional: notes.additional,
        created_at: notes.updated_at,
        updated_at: notes.updated_at,
      } as VisitNotes)
    : null;

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
          {editable ? (
            <>
              <VisitStatusSelector scheduleId={schedule.id} currentStatus={(schedule.status ?? STATUS_VALUES.pending) as VisitStatus} />
              <LabelBadge label={schedule.label} />
            </>
          ) : (
            <>
              <StatusBadge status={(schedule.status ?? STATUS_VALUES.pending) as VisitStatus} />
              <LabelBadge label={schedule.label} />
            </>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <CloudOff className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Luring — menampilkan data tersimpan terakhir.
          {editable
            ? ` Perubahan disimpan lokal dan ${hasFinalStatus ? "status akhir dikunci sampai online" : "disinkronkan otomatis saat koneksi pulih"}.`
            : " Edit aktif kembali setelah sinkron."}
        </span>
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

      {editable && (
        <div className="rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold">Catatan Kunjungan</h2>
          <VisitNotesForm scheduleId={schedule.id} defaultValues={notesDefault} />
        </div>
      )}

      {!editable && notes && (notes.observation || notes.problem || notes.recommend || notes.additional) && (
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

      <div className="rounded-xl border p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dokumentasi Foto</h2>
            {editable && (
              <>
                <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Camera className="h-4 w-4 mr-1.5" />}
                  {uploading ? "Memproses..." : "Tambah Foto"}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">({photos.length})</p>
        </div>

        {photoUrls.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative aspect-square w-full rounded-lg border overflow-hidden group">
                <Image
                  src={photoUrls[i] ?? ""}
                  alt={photo.caption ?? `Foto kunjungan ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {editable && (
                  <button
                    onClick={() => handleDeletePhoto(photo)}
                    className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    aria-label="Hapus foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          !uploading && (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada foto tersimpan offline.</p>
            </div>
          )
        )}
      </div>

      {editable && (
        <div className="rounded-xl border p-5">
          <VisitGps
            scheduleId={schedule.id}
            currentStatus={schedule.status}
            currentLatitude={schedule.latitude}
            currentLongitude={schedule.longitude}
            currentAccuracy={schedule.accuracy}
            editable
          />
        </div>
      )}
    </div>
  );
}