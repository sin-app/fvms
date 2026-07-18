"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchScheduleList, fetchScheduleById } from "../api/schedule-client";
import { createScheduleAction, updateScheduleAction, deleteScheduleAction, updateVisitStatusAction, bulkActionSchedules } from "../actions/schedule-actions";
import type { ScheduleFilters } from "../types";
import type { ScheduleInput } from "../schema/schedule-schema";

export function useSchedules(filters: ScheduleFilters) {
  return useQuery({
    queryKey: ["schedules", filters],
    queryFn: () => fetchScheduleList(filters),
  });
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: () => fetchScheduleById(id),
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ScheduleInput) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.set(k, v ?? ""));
      const result = await createScheduleAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string } & ScheduleInput) => {
      const fd = new FormData();
      fd.set("id", data.id);
      Object.entries(data).forEach(([k, v]) => fd.set(k, v ?? ""));
      const result = await updateScheduleAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal berhasil diupdate");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await deleteScheduleAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ids: string[]; action: string }) => {
      const fd = new FormData();
      fd.set("ids", JSON.stringify(data.ids));
      fd.set("bulkAction", data.action);
      const result = await bulkActionSchedules({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Aksi berhasil diproses");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; status: string; latitude?: number; longitude?: number }) => {
      const fd = new FormData();
      fd.set("id", data.id);
      fd.set("status", data.status);
      if (data.latitude) fd.set("latitude", String(data.latitude));
      if (data.longitude) fd.set("longitude", String(data.longitude));
      const result = await updateVisitStatusAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      toast.success("Status berhasil diupdate");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
