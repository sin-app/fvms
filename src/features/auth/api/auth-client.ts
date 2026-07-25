"use client";

import { createClient } from "@/lib/supabase/client";
import type { LoginInput, ResetPasswordInput, ProfileInput } from "../schema/auth-schema";
import type { User } from "@/types";
import { getCurrentUserAction, updateProfileAction } from "../actions/user-actions";

export async function login(input: LoginInput) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);

  if (error) throw error;
  return data;
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(input: ResetPasswordInput) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  // Gunakan server action untuk bypass RLS (service role)
  try {
    const dbUser = await getCurrentUserAction();
    if (dbUser) return dbUser;
  } catch {
    // fallback ke JWT metadata jika server action gagal
  }

  // Fallback: baca dari JWT metadata
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const meta = user.user_metadata ?? {};
  const appMeta = user.app_metadata ?? {};
  const role = (meta.role ?? appMeta.role) as User["role"] | undefined;
  return {
    id: user.id,
    email: user.email ?? "",
    name: (meta.name as string) ?? (meta.full_name as string) ?? "",
    role: role ?? "produksi",
  } as User;
}

export async function updateProfile(input: ProfileInput) {
  const ctx = await getCurrentUser();
  if (!ctx?.id) throw new Error("Not authenticated");
  const fd = new FormData();
  fd.set("id", ctx.id);
  fd.set("name", input.name ?? "");
  fd.set("phone", input.phone ?? "");
  const result = await updateProfileAction({ success: false }, fd);
  if (!result.success) throw new Error(result.error);
  return result.data;
}
