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

  if (ctx.role === "qc") {
    // QC hanya boleh melihat petugas di kabupaten tugasnya. Assignment kosong
    // berarti tidak boleh melihat siapa pun (fail-closed).
    const scope = kabupatenId ? [kabupatenId] : ctx.assignedKabupatenIds;
    if (scope.length === 0) return [];
    query = query.overlaps("assigned_kabupaten_ids", scope);
  } else if (kabupatenId) {
    query = query.overlaps("assigned_kabupaten_ids", [kabupatenId]);
  }

  const { data } = await query.order("name");

  return data ?? [];
}
