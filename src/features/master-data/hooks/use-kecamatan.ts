"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchKecamatanList,
} from "../api/master-data-client";
import { useLocalQuery } from "@/lib/offline/use-local-query";
import { loadOfflineKecamatan } from "../services/offline-master-data";
import { createKecamatanAction, updateKecamatanAction } from "../actions/master-data-actions";
import type { KecamatanInput } from "../schema/master-data-schema";

export function useKecamatanList(kabupatenId?: string, search?: string, page?: number) {
  return useQuery({
    queryKey: ["kecamatan", kabupatenId, search, page],
    queryFn: () => fetchKecamatanList(kabupatenId, search, page),
    enabled: true,
  });
}

export function useAllKecamatan(kabupatenId: string) {
  return useLocalQuery({
    queryKey: ["kecamatan", "all", kabupatenId],
    queryFn: () => loadOfflineKecamatan(kabupatenId),
    enabled: !!kabupatenId,
  });
}

export function useCreateKecamatan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: KecamatanInput) => {
      const formData = new FormData();
      formData.set("kabupaten_id", data.kabupaten_id);
      formData.set("name", data.name);
      formData.set("code", data.code);
      const result = await createKecamatanAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kecamatan"] });
      queryClient.invalidateQueries({ queryKey: ["master-data"] });
      toast.success("Kecamatan berhasil dibuat");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateKecamatan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & KecamatanInput) => {
      const formData = new FormData();
      formData.set("id", data.id);
      formData.set("kabupaten_id", data.kabupaten_id);
      formData.set("name", data.name);
      formData.set("code", data.code);
      const result = await updateKecamatanAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kecamatan"] });
      queryClient.invalidateQueries({ queryKey: ["master-data"] });
      toast.success("Kecamatan berhasil diupdate");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
