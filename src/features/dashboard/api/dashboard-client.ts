"use server";

import { createClient } from "@/lib/supabase/server-client";
import { getDashboardData } from "../services/dashboard-service";

export async function fetchDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  return getDashboardData(user.id);
}
