"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchScheduleList } from "../api/schedule-client";
import { deleteScheduleAction, updateVisitStatusAction, bulkActionSchedules, shiftScheduleDateAction } from "../actions/schedule-actions";
import type { ScheduleFilters } from "../types";

export function useSchedules(filters: ScheduleFilters) {
  return useQuery({
    queryKey: ["schedules", filters],
    queryFn: () => fetchScheduleList(filters),
    staleTime: 15_000,
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
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["cgr"] });
      toast.success("Jadwal berhasil dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useShiftScheduleDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("days", String(days));
      const result = await shiftScheduleDateAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["visit"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success(vars.days > 0 ? "Jadwal digeser +1 hari" : "Jadwal dikembalikan -1 hari");
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
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["visit"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["cgr"] });
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
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["visit", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["visit-timeline", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("Status berhasil diupdate");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
