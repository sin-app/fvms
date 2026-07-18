"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchVisitDetail, fetchVisitTimeline } from "../api/visit-client";
import { saveVisitNotesAction, uploadPhotoAction, deletePhotoAction } from "../actions/visit-actions";
export function useVisitDetail(id: string) {
  return useQuery({
    queryKey: ["visit", id],
    queryFn: () => fetchVisitDetail(id),
    enabled: !!id,
  });
}

export function useVisitTimeline(scheduleId: string) {
  return useQuery({
    queryKey: ["visit-timeline", scheduleId],
    queryFn: () => fetchVisitTimeline(scheduleId),
    enabled: !!scheduleId,
  });
}

export function useSaveVisitNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { schedule_id: string; observation?: string; problem?: string; recommend?: string; additional?: string }) => {
      const fd = new FormData();
      fd.set("schedule_id", data.schedule_id);
      if (data.observation) fd.set("observation", data.observation);
      if (data.problem) fd.set("problem", data.problem);
      if (data.recommend) fd.set("recommend", data.recommend);
      if (data.additional) fd.set("additional", data.additional);
      const result = await saveVisitNotesAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit", variables.schedule_id] });
      toast.success("Catatan berhasil disimpan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { schedule_id: string; file: File }) => {
      const fd = new FormData();
      fd.set("schedule_id", data.schedule_id);
      fd.set("file", data.file);
      const result = await uploadPhotoAction(fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit", variables.schedule_id] });
      toast.success("Foto berhasil diupload");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { photo_id: string; schedule_id: string }) => {
      const fd = new FormData();
      fd.set("photo_id", data.photo_id);
      fd.set("schedule_id", data.schedule_id);
      const result = await deletePhotoAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit", variables.schedule_id] });
      toast.success("Foto berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
