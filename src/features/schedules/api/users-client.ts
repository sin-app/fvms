"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";
import type { User } from "@/types";

export async function fetchAllFieldOfficers(): Promise<Pick<User, "id" | "name" | "email" | "role">[]> {
  const ctx = await getAuthContext();
  if (!ctx) return [];
  if (ctx.role !== "admin" && ctx.role !== "qc") return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, name, email, role")
    .in("role", ["produksi", "qc"])
    .eq("is_active", true)
    .order("name");

  return data ?? [];
}
