"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteScheduleAction, updateVisitStatusAction, bulkActionSchedules, shiftScheduleDateAction, restoreScheduleAction } from "../actions/schedule-actions";
import {
  queueScheduleUpdate,
  queueScheduleShift,
  queueScheduleDelete,
} from "@/features/visits/services/visit-client";
import { useSync } from "@/lib/offline/sync-context";
import { useAuth } from "@/features/auth/components/auth-context";
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
  const { online } = useSync();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!online) {
        await queueScheduleDelete(id);
        toast.success("Jadwal dihapus (luring) — akan disinkronkan");
        return;
      }
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

export function useRestoreSchedule() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!online) {
        throw new Error("Pulihkan jadwal memerlukan koneksi online");
      }
      const fd = new FormData();
      fd.set("id", id);
      const result = await restoreScheduleAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["cgr"] });
      toast.success("Jadwal berhasil dipulihkan");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useShiftScheduleDate() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  return useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      if (!online) {
        await queueScheduleShift(id, days);
        toast.success(days > 0 ? "Jadwal digeser +1 hari (luring)" : "Jadwal dikembalikan -1 hari (luring)");
        return;
      }
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

const OFFLINE_BULK_ACTIONS = new Set([
  "approve", "delete", "shift_forward", "shift_backward",
  "pending", "in_progress", "gagal_partial", "completed",
]);

export function useBulkAction() {
  const queryClient = useQueryClient();
  const { online } = useSync();
  const { user } = useAuth();
  const role = user?.role;
  return useMutation({
    mutationFn: async (data: { ids: string[]; action: string }) => {
      if (!online) {
        if (data.action === "cancel") {
          throw new Error("Aksi cancel (gagal_total) memerlukan koneksi online");
        }
        if (!OFFLINE_BULK_ACTIONS.has(data.action)) {
          throw new Error("Aksi tidak tersedia saat luring");
        }
        if (data.action === "delete" && role !== "admin") {
          throw new Error("Hanya admin yang dapat menghapus jadwal");
        }
        for (const id of data.ids) {
          if (data.action === "delete") {
            await queueScheduleDelete(id);
          } else if (data.action === "shift_forward") {
            await queueScheduleShift(id, 1);
          } else if (data.action === "shift_backward") {
            await queueScheduleShift(id, -1);
          } else {
            await queueScheduleUpdate({ id, status: data.action === "approve" ? "in_progress" : data.action });
          }
        }
        toast.success("Aksi tersimpan (luring) — akan disinkronkan");
        return;
      }
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
