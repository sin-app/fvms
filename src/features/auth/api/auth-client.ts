import { createClient } from "@/lib/supabase/client";
import type { LoginInput, ResetPasswordInput, ProfileInput } from "../schema/auth-schema";
import type { User } from "@/types";

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
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (data) return data;

  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: (meta.name as string) ?? (meta.full_name as string) ?? "",
    role: (meta.role as User["role"]) ?? "field_officer",
  } as User;
}

export async function updateProfile(input: ProfileInput) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("users")
    .update(input)
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
