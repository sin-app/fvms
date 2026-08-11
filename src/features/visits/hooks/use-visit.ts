"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchVisitTimeline, fetchSignedPhotoUrls } from "../api/visit-client";
import { saveVisitNotesAction, uploadPhotoAction, deletePhotoAction, updatePhotoAction } from "../actions/visit-actions";
import { useSync } from "@/lib/offline/sync-context";
import { useLocalQuery } from "@/lib/offline/use-local-query";
import { offlineRowToSchedule } from "@/features/schedules/services/offline-read";
import type { Schedule, VisitNotes, VisitPhoto } from "@/types";
import {
  queueVisitNotesUpdate,
  queuePhotoUpload,
  queuePhotoDelete,
  queuePhotoCaptionUpdate,
  getOfflineVisitDetail,
  offlinePhotoObjectUrl,
} from "../services/visit-client";

export const OFFLINE_SAVED_TOAST = "Tersimpan (luring) — akan disinkronkan otomatis";

export interface ComposedVisitDetail {
  schedule: Schedule | undefined;
  notes: VisitNotes | null;
  photos: VisitPhoto[];
}

export function useVisitDetail(id: string) {
  const { online } = useSync();
  return useLocalQuery<ComposedVisitDetail>({
    queryKey: ["visit", id, online],
    queryFn: async () => {
      const local = await getOfflineVisitDetail(id);
      if (!local.schedule) return { schedule: undefined, notes: null, photos: [] };

      const signed = online
        ? await fetchSignedPhotoUrls(local.photos.filter((p) => !p.blob).map((p) => p.url))
        : {};

      const photos: VisitPhoto[] = local.photos.map((p) => ({
        id: p.id,
        schedule_id: p.schedule_id,
        url: p.blob ? (offlinePhotoObjectUrl(p) ?? "") : (signed[p.url] ?? ""),
        thumbnail: null,
        caption: p.caption,
        file_size: p.file_size,
        mime_type: p.mime_type,
        created_at: p.created_at,
      }));

      const notes: VisitNotes | null = local.notes
        ? {
            id: local.schedule.id,
            schedule_id: local.schedule.id,
            observation: local.notes.observation,
            problem: local.notes.problem,
            recommend: local.notes.recommend,
            additional: local.notes.additional,
            created_at: local.notes.updated_at,
            updated_at: local.notes.updated_at,
          }
        : null;

      const schedule: Schedule = {
        ...offlineRowToSchedule(local.schedule),
        visit_notes: notes ?? undefined,
        visit_photos: photos,
      };

      return { schedule, notes, photos };
    },
    enabled: !!id,
  });
}

export function useVisitTimeline(scheduleId: string) {
  const { online } = useSync();
  return useQuery({
    queryKey: ["visit-timeline", scheduleId],
    queryFn: () => fetchVisitTimeline(scheduleId),
    enabled: !!scheduleId && online,
  });
}

export function useSaveVisitNotes() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async (data: { schedule_id: string; observation?: string; problem?: string; recommend?: string; additional?: string }) => {
      if (!online) {
        await queueVisitNotesUpdate(data);
        toast.success(OFFLINE_SAVED_TOAST);
        return undefined;
      }
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
      queryClient.invalidateQueries({ queryKey: ["visit-timeline", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async (data: { schedule_id: string; file: File }) => {
      if (!online) {
        await queuePhotoUpload({ scheduleId: data.schedule_id, blob: data.file, mimeType: data.file.type || "image/jpeg" });
        toast.success(OFFLINE_SAVED_TOAST);
        return null;
      }
      const fd = new FormData();
      fd.set("schedule_id", data.schedule_id);
      fd.set("file", data.file);
      const result = await uploadPhotoAction(fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["visit-timeline", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async (data: { photo_id: string; schedule_id: string }) => {
      if (!online) {
        await queuePhotoDelete(data.photo_id);
        toast.success(OFFLINE_SAVED_TOAST);
        return;
      }
      const fd = new FormData();
      fd.set("photo_id", data.photo_id);
      fd.set("schedule_id", data.schedule_id);
      const result = await deletePhotoAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["visit-timeline", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async (data: { photo_id: string; schedule_id: string; caption: string }) => {
      if (!online) {
        await queuePhotoCaptionUpdate(data.photo_id, data.schedule_id, data.caption);
        toast.success(OFFLINE_SAVED_TOAST);
        return;
      }
      const fd = new FormData();
      fd.set("photo_id", data.photo_id);
      fd.set("schedule_id", data.schedule_id);
      fd.set("caption", data.caption);
      const result = await updatePhotoAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["visit", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["visit-timeline", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", variables.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
