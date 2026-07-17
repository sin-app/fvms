"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchKabupatenList,
  fetchAllKabupaten,
} from "../api/master-data-client";
import { createKabupatenAction, updateKabupatenAction } from "../actions/master-data-actions";
import type { KabupatenInput } from "../schema/master-data-schema";

export function useKabupatenList(search?: string, page?: number) {
  return useQuery({
    queryKey: ["kabupaten", search, page],
    queryFn: () => fetchKabupatenList(search, page),
  });
}

export function useAllKabupaten() {
  return useQuery({
    queryKey: ["kabupaten", "all"],
    queryFn: fetchAllKabupaten,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateKabupaten() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: KabupatenInput) => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("code", data.code);
      const result = await createKabupatenAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kabupaten"] });
      toast.success("Kabupaten berhasil dibuat");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateKabupaten() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & KabupatenInput) => {
      const formData = new FormData();
      formData.set("id", data.id);
      formData.set("name", data.name);
      formData.set("code", data.code);
      const result = await updateKabupatenAction({ success: false }, formData);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kabupaten"] });
      toast.success("Kabupaten berhasil diupdate");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
