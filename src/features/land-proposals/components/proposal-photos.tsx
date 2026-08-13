"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Eye } from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useUploadProposalPhoto, useDeleteProposalPhoto } from "../hooks/use-proposal-photos";
import type { LandProposalPhoto } from "@/types";

interface ProposalPhotosProps {
  proposalId: string;
  photos: LandProposalPhoto[];
  editable?: boolean;
}

export function ProposalPhotos({ proposalId, photos, editable = false }: ProposalPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadProposalPhoto();
  const deletePhoto = useDeleteProposalPhoto();
  const [preview, setPreview] = useState<string | null>(null);
  const [viewer, setViewer] = useState<LandProposalPhoto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LandProposalPhoto | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const toUpload = compressed.size > 0 ? compressed : file;
      await uploadPhoto.mutateAsync({ proposal_id: proposalId, file: toUpload });
    } catch {
      uploadPhoto.reset();
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deletePhoto.mutateAsync({
        photo_id: pendingDelete.id,
        proposal_id: proposalId,
      });
      setPendingDelete(null);
    } catch {
      // error toasted in hook
    }
  }

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Foto Lahan</p>
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
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            multiple={false}
          />
        </div>
      )}

      {preview && (
        <div className="relative rounded-lg overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden border aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? "Foto pengajuan"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewer(photo)}
                  aria-label="Lihat foto"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                {editable && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPendingDelete(photo)}
                    disabled={deletePhoto.isPending}
                    aria-label="Hapus foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !preview && (
          <p className="text-xs text-muted-foreground">
            {editable ? "Belum ada foto. Tambahkan dokumentasi lahan (opsional)." : "Belum ada foto."}
          </p>
        )
      )}

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogTitle className="sr-only">Lihat foto</DialogTitle>
          {viewer && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewer.url}
                alt={viewer.caption ?? "Foto pengajuan"}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
              {viewer.caption && (
                <p className="text-sm text-muted-foreground">{viewer.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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