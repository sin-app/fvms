"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { loginSchema, resetPasswordSchema, updatePasswordSchema } from "../schema/auth-schema";
import { isLoginRateLimited, registerLoginFailure, registerLoginSuccess, isEmailRateLimited, registerEmailFailure, isIpRateLimited, registerIpFailure } from "@/lib/auth/rate-limit";
import type { ActionResponse } from "@/types/common";
import { logger } from "@/lib/logger";

/** Ambil IP klien. Header x-forwarded-for dikontrol proxy Vercel;
 *  fallback x-real-ip untuk kasus tanpa rantai proxy. */
async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = h.get("x-forwarded-for")?.trim();
  if (!forwarded) return null;
  // Di belakang Vercel, nilai pertama diisi proxy lokal asli;
  // gunakan nilai terakhir dari rantai yang ditambahkan Vercel.
  const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

export async function loginAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ip = await getClientIp();
  if (await isLoginRateLimited(parsed.data.email, ip)) {
    return {
      success: false,
      error: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await registerLoginFailure(parsed.data.email, ip);
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "Email atau password salah" };
    }
    logger.warn("loginAction: unexpected sign-in error", {
      email: parsed.data.email,
      message: error.message,
    });
    return { success: false, error: "Gagal masuk. Coba lagi nanti." };
  }

  registerLoginSuccess(parsed.data.email, ip);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const adminClient = createAdminClient();
    await adminClient
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPasswordAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const rawData = { email: formData.get("email") as string };

  const parsed = resetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const ip = await getClientIp();
  if (await isEmailRateLimited("reset-password", parsed.data.email, ip)) {
    return {
      success: false,
      error: "Terlalu banyak permintaan. Coba lagi dalam 15 menit.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    },
  );

  if (error) {
    await registerEmailFailure("reset-password", parsed.data.email, ip);
    logger.warn("resetPasswordAction: unexpected error", {
      email: parsed.data.email,
      message: error.message,
    });
    return { success: false, error: "Gagal mengirim email reset. Coba lagi nanti." };
  }

  return {
    success: true,
    data: undefined,
  };
}

export async function updatePasswordAction(
  _prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ip = await getClientIp();
  if (await isIpRateLimited("update-password", ip)) {
    return {
      success: false,
      error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
    };
  }

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    await registerIpFailure("update-password", ip);
    logger.warn("updatePasswordAction: unexpected error", { message: error.message });
    return { success: false, error: "Gagal memperbarui password. Coba lagi nanti." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}


