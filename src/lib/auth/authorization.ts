import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";

export type UserRole = "admin" | "supervisor" | "field_officer";

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  let userId: string | undefined;
  let metaRole: UserRole | undefined;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const meta = user.user_metadata ?? {};
      metaRole = (meta.role ?? user.app_metadata?.role) as UserRole | undefined;
    }
  } catch {
    // getUser can intermittently fail; fall back to session below.
  }

  if (!userId) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
        const meta = session.user.user_metadata ?? {};
        metaRole = (meta.role ?? session.user.app_metadata?.role) as UserRole | undefined;
      }
    } catch {
      // ignore
    }
  }

  if (!userId) return null;

  if (metaRole) {
    return { userId, role: metaRole };
  }

  // Fallback: read role from the database via the admin client.
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    const role = (data?.role as UserRole | undefined) ?? "field_officer";
    return { userId, role };
  } catch {
    return { userId, role: "field_officer" };
  }
}

export function isPrivileged(role: UserRole): boolean {
  return role === "admin" || role === "supervisor";
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Unauthorized");
  if (ctx.role !== "admin") throw new Error("Hanya admin yang diizinkan");
  return ctx;
}

export async function canAccessSchedule(
  scheduleId: string,
  ctx: AuthContext,
): Promise<boolean> {
  if (isPrivileged(ctx.role)) return true;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .maybeSingle();

  return data?.user_id === ctx.userId;
}
