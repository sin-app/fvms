"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext } from "@/lib/auth/authorization";
import type { User } from "@/types";

export async function fetchAllFieldOfficers(
  kabupatenId?: string,
): Promise<Pick<User, "id" | "name" | "email" | "role">[]> {
  const ctx = await getAuthContext();
  if (!ctx) return [];
  if (ctx.role !== "admin" && ctx.role !== "qc") return [];

  const admin = createAdminClient();
  let query = admin
    .from("users")
    .select("id, name, email, role")
    .in("role", ["produksi"])
    .eq("is_active", true);

  if (kabupatenId) {
    query = query.overlaps("assigned_kabupaten_ids", [kabupatenId]);
  } else if (ctx.role === "qc" && ctx.assignedKabupatenIds.length > 0) {
    query = query.overlaps("assigned_kabupaten_ids", ctx.assignedKabupatenIds);
  }

  const { data } = await query.order("name");

  return data ?? [];
}
