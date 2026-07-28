"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createUser, updateUser, toggleUserActive, getUsers, setPassword, getCurrentUserFromDb } from "../services/user-service";
import { userSchema, setPasswordSchema } from "../schema/user-schema";
import { profileSchema } from "../schema/auth-schema";
import type { ActionResponse } from "@/types/common";
import { getAuthContext } from "@/lib/auth/authorization";
import type { User } from "@/types";

export async function getCurrentUserAction(): Promise<User | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  return getCurrentUserFromDb(ctx.userId);
}

export async function updateProfileAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const id = formData.get("id") as string;
  if (id !== ctx.userId) return { success: false, error: "Tidak dapat mengubah profil orang lain" };

  const raw = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || "",
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ name: parsed.data.name, phone: parsed.data.phone || null })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function createUserAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin") return { success: false, error: "Hanya admin yang diizinkan" };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as "admin" | "qc" | "produksi",
    phone: (formData.get("phone") as string) || undefined,
    is_active: formData.get("is_active") === "true",
    assigned_kabupaten_ids: (formData.get("assigned_kabupaten_ids") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
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
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin") return { success: false, error: "Hanya admin yang diizinkan" };

  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID tidak valid" };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as "admin" | "qc" | "produksi",
    phone: (formData.get("phone") as string) || undefined,
    is_active: formData.get("is_active") === "true",
    assigned_kabupaten_ids: (formData.get("assigned_kabupaten_ids") as string)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
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

export async function toggleUserActiveAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin") return { success: false, error: "Hanya admin yang diizinkan" };

  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  try {
    await toggleUserActive(id, isActive);
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengubah status pengguna";
    return { success: false, error: msg };
  }
}

export async function getUsersAction(): Promise<User[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Unauthorized");
  if (ctx.role !== "admin") throw new Error("Hanya admin yang diizinkan");
  return getUsers();
}

export async function setPasswordAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };
  if (ctx.role !== "admin") return { success: false, error: "Hanya admin yang diizinkan" };

  const parsed = setPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await setPassword(parsed.data.id, parsed.data.password);
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal mengatur password";
    return { success: false, error: msg };
  }
}
