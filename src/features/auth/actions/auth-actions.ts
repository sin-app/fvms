"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { loginSchema, resetPasswordSchema, profileSchema } from "../schema/auth-schema";
import { isLoginRateLimited, registerLoginFailure, registerLoginSuccess, isEmailRateLimited, registerEmailFailure, isIpRateLimited, registerIpFailure } from "@/lib/auth/rate-limit";
import type { ActionResponse } from "@/types/common";

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

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (isLoginRateLimited(parsed.data.email, ip)) {
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
    registerLoginFailure(parsed.data.email, ip);
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "Email atau password salah" };
    }
    return { success: false, error: error.message };
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
  redirect("/dashboard");
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

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (isEmailRateLimited("reset-password", parsed.data.email, ip)) {
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
    registerEmailFailure("reset-password", parsed.data.email, ip);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: undefined,
  };
}

export async function updatePasswordAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (isIpRateLimited("update-password", ip)) {
    return {
      success: false,
      error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Password tidak cocok",
      fieldErrors: { confirmPassword: ["Password tidak cocok"] },
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password minimal 6 karakter",
      fieldErrors: { password: ["Password minimal 6 karakter"] },
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    registerIpFailure("update-password", ip);
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateProfileAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const rawData = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
  };

  const parsed = profileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("users")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
