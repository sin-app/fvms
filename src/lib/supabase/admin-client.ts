import { createClient } from "@supabase/supabase-js";
import { getConfig } from "@/lib/config";

export function createAdminClient() {
  const config = getConfig();
  return createClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
