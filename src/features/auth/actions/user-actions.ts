"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-client";
import { createUser, updateUser, toggleUserActive } from "../services/user-service";
import { userSchema } from "../schema/user-schema";
import type { ActionResponse } from "@/types/common";

export async function createUserAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as "admin" | "supervisor" | "field_officer",
    phone: (formData.get("phone") as string) || undefined,
    is_active: formData.get("is_active") === "true",
  };

  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await createUser(parsed.data);
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membuat pengguna";
    return { success: false, error: msg };
  }
}

export async function updateUserAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as "admin" | "supervisor" | "field_officer",
    phone: (formData.get("phone") as string) || undefined,
    is_active: formData.get("is_active") === "true",
  };

  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateUser(id, parsed.data);
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengupdate pengguna";
    return { success: false, error: msg };
  }
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  await toggleUserActive(id, isActive);
  revalidatePath("/users");
}
