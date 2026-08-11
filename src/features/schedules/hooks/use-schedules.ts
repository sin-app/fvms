"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteScheduleAction, updateVisitStatusAction, bulkActionSchedules, shiftScheduleDateAction } from "../actions/schedule-actions";
import { queueScheduleUpdate } from "@/features/visits/services/visit-client";
import { useSync } from "@/lib/offline/sync-context";
import { useLocalQuery } from "@/lib/offline/use-local-query";
import { loadOfflineScheduleRows } from "../services/offline-read";
import type { ScheduleFilters, ScheduleListResult } from "../types";

export function useSchedules(filters: ScheduleFilters) {
  return useLocalQuery<ScheduleListResult>({
    queryKey: ["schedules", filters],
    queryFn: async () => {
      const rows = await loadOfflineScheduleRows(filters);
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      return {
        data: rows.slice(from, from + pageSize),
        total: rows.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
      };
    },
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
  const { online } = useSync();
  return useMutation({
    mutationFn: async (data: { id: string; status: string; latitude?: number; longitude?: number }) => {
      if (!online) {
        await queueScheduleUpdate({
          id: data.id,
          status: data.status,
          ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
          ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
          ...(data.latitude !== undefined ? { visit_time: new Date().toISOString() } : {}),
        });
        toast.success("Status tersimpan (luring) — akan disinkronkan");
        return { success: true };
      }
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
