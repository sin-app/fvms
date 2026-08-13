"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadProposalPhotoAction, deleteProposalPhotoAction } from "../actions/land-proposal-actions";

export function useUploadProposalPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { proposal_id: string; file: File }) => {
      const fd = new FormData();
      fd.set("proposal_id", data.proposal_id);
      fd.set("file", data.file);
      const result = await uploadProposalPhotoAction(fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Foto berhasil diupload");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProposalPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { photo_id: string; proposal_id: string }) => {
      const fd = new FormData();
      fd.set("photo_id", data.photo_id);
      fd.set("proposal_id", data.proposal_id);
      const result = await deleteProposalPhotoAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Foto dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}