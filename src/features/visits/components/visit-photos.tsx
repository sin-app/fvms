"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2, Pencil, Trash2, Eye } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useUploadPhoto, useDeletePhoto, useUpdatePhoto } from "../hooks/use-visit";
import type { VisitPhoto } from "@/types";

interface VisitPhotosProps {
  scheduleId: string;
  photos: VisitPhoto[];
  onDelete: (photoId: string) => void;
  deleting?: boolean;
  editable?: boolean;
}

export function VisitPhotos({ scheduleId, photos, onDelete, deleting, editable = true }: VisitPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const updatePhoto = useUpdatePhoto();
  const [preview, setPreview] = useState<string | null>(null);

  // Lightbox (view)
  const [viewer, setViewer] = useState<VisitPhoto | null>(null);
  // Edit caption
  const [editing, setEditing] = useState<VisitPhoto | null>(null);
  const [captionValue, setCaptionValue] = useState("");
  // Delete confirm
  const [pendingDelete, setPendingDelete] = useState<VisitPhoto | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      // Compress/resize large photos on the client so the Server Action payload
      // stays small and avoids "unexpected response" on big uploads.
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const toUpload = compressed.size > 0 ? compressed : file;
      await uploadPhoto.mutateAsync({ schedule_id: scheduleId, file: toUpload });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memproses foto";
      uploadPhoto.reset();
      toast.error(msg);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function openEdit(photo: VisitPhoto) {
    setCaptionValue(photo.caption ?? "");
    setEditing(photo);
  }

  async function confirmEdit() {
    if (!editing) return;
    try {
      await updatePhoto.mutateAsync({
        photo_id: editing.id,
        schedule_id: scheduleId,
        caption: captionValue,
      });
      setEditing(null);
    } catch {
      // error toasted in hook
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deletePhoto.mutateAsync({
        photo_id: pendingDelete.id,
        schedule_id: scheduleId,
      });
      onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      // error toasted in hook
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Dokumentasi Foto</h3>
        {editable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-1.5" />
            )}
            Tambah Foto
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {preview && (
        <div className="relative rounded-lg overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden border aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? "Foto kunjungan"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewer(photo)}
                  aria-label="Lihat foto"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {editable && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(photo)}
                    aria-label="Edit keterangan"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {editable && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPendingDelete(photo)}
                    disabled={deleting}
                    aria-label="Hapus foto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {photo.caption && (
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-2 py-1">
                  <p className="text-[11px] text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !preview && (
          <div className="text-center py-8 border rounded-lg bg-muted/20">
            <Camera className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Belum ada foto. Klik &ldquo;Tambah Foto&rdquo; untuk mendokumentasikan kunjungan.
            </p>
          </div>
        )
      )}

      {/* Lightbox viewer */}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="sm:max-w-3xl">
          {viewer && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewer.url}
                alt={viewer.caption ?? "Foto kunjungan"}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
              {viewer.caption && (
                <p className="text-sm text-muted-foreground">{viewer.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit caption */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Keterangan Foto</DialogTitle>
            <DialogDescription>
              Tambahkan atau ubah keterangan untuk foto ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="caption">Keterangan</Label>
            <Textarea
              id="caption"
              value={captionValue}
              onChange={(e) => setCaptionValue(e.target.value)}
              placeholder="Misal: Kondisi tanaman saat kunjungan"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={updatePhoto.isPending}>
              Batal
            </Button>
            <Button onClick={confirmEdit} disabled={updatePhoto.isPending}>
              {updatePhoto.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Hapus Foto"
        message="Apakah Anda yakin ingin menghapus foto ini? Tindakan tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deletePhoto.isPending}
      />
    </div>
  );
}
