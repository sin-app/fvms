"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import type { User } from "@/types";

export async function fetchAllFieldOfficers(): Promise<User[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, name, email, role")
    .in("role", ["field_officer", "supervisor"])
    .eq("is_active", true)
    .order("name");

  return (data ?? []) as unknown as User[];
}
