"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";
import type { User } from "@/types";

export async function fetchAllFieldOfficers(): Promise<User[]> {
  const ctx = await getAuthContext();
  if (!ctx) return [];
  // Hanya admin/QC yang berhak melihat daftar petugas lapangan.
  if (ctx.role !== "admin" && ctx.role !== "qc") return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, name, email, role")
    .in("role", ["produksi", "qc"])
    .eq("is_active", true)
    .order("name");

  return (data ?? []) as unknown as User[];
}
