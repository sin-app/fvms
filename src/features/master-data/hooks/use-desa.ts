"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchDesaList,
  fetchAllDesa,
} from "../api/master-data-client";
import { useLocalQuery } from "@/lib/offline/use-local-query";
import { loadOfflineDesaOptions } from "../services/offline-master-data";
import { createDesaAction, updateDesaAction } from "../actions/master-data-actions";
import type { DesaInput } from "../schema/master-data-schema";

export function useDesaList(kecamatanId?: string, search?: string, page?: number) {
  return useQuery({
    queryKey: ["desa", kecamatanId, search, page],
    queryFn: () => fetchDesaList(kecamatanId, search, page),
  });
}

export function useAllDesa(kecamatanId: string) {
  return useQuery({
    queryKey: ["desa", "all", kecamatanId],
    queryFn: () => fetchAllDesa(kecamatanId),
    enabled: !!kecamatanId,
    staleTime: 10 * 60 * 1000,
  });
}

/** Opsi desa untuk dropdown filter (ala Excel), opsional dibatasi kabupaten. */
export function useDesaFilterOptions(kabupatenId?: string) {
  return useLocalQuery({
    queryKey: ["desa", "filter", kabupatenId ?? "all"],
    queryFn: () => loadOfflineDesaOptions(kabupatenId),
  });
}

export function useCreateDesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DesaInput) => {
      const formData = new FormData();
      formData.set("kecamatan_id", data.kecamatan_id);
      formData.set("name", data.name);
      formData.set("code", data.code);
      const result = await createDesaAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desa"] });
      queryClient.invalidateQueries({ queryKey: ["master-data"] });
      toast.success("Desa berhasil dibuat");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateDesa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & DesaInput) => {
      const formData = new FormData();
      formData.set("id", data.id);
      formData.set("kecamatan_id", data.kecamatan_id);
      formData.set("name", data.name);
      formData.set("code", data.code);
      const result = await updateDesaAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desa"] });
      queryClient.invalidateQueries({ queryKey: ["master-data"] });
      toast.success("Desa berhasil diupdate");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}