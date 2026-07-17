"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchKecamatanList,
  fetchAllKecamatan,
} from "../api/master-data-client";
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
  return useQuery({
    queryKey: ["kecamatan", "all", kabupatenId],
    queryFn: () => fetchAllKecamatan(kabupatenId),
    enabled: !!kabupatenId,
    staleTime: 10 * 60 * 1000,
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
      toast.success("Kecamatan berhasil diupdate");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
