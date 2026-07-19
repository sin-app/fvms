"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUsersAction } from "../actions/user-actions";
import { createUserAction, updateUserAction, toggleUserActiveAction, setPasswordAction } from "../actions/user-actions";
import type { UserInput } from "../schema/user-schema";
export function useUsersAdmin() {
  return useQuery({
    queryKey: ["users-admin"],
    queryFn: getUsersAction,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UserInput) => {
      const fd = new FormData();
      fd.set("name", data.name);
      fd.set("email", data.email);
      fd.set("role", data.role);
      if (data.phone) fd.set("phone", data.phone);
      fd.set("is_active", String(data.is_active));
      const result = await createUserAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-admin"] });
      toast.success("Pengguna berhasil dibuat");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string } & Partial<UserInput>) => {
      const fd = new FormData();
      fd.set("id", data.id);
      if (data.name) fd.set("name", data.name);
      if (data.email) fd.set("email", data.email);
      if (data.role) fd.set("role", data.role);
      if (data.phone) fd.set("phone", data.phone);
      fd.set("is_active", String(data.is_active ?? true));
      const result = await updateUserAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-admin"] });
      toast.success("Pengguna berhasil diupdate");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; is_active: boolean }) => {
      const fd = new FormData();
      fd.set("id", data.id);
      fd.set("is_active", String(data.is_active));
      const result = await toggleUserActiveAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-admin"] });
      toast.success("Status pengguna berhasil diubah");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; password: string }) => {
      const fd = new FormData();
      fd.set("id", data.id);
      fd.set("password", data.password);
      const result = await setPasswordAction({ success: false }, fd);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-admin"] });
      toast.success("Password berhasil diatur");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
