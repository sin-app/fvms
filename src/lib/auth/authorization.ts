import { createClient } from "@/lib/supabase/server-client";

export type UserRole = "admin" | "supervisor" | "field_officer";

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const metaRole = (meta.role ?? user.app_metadata?.role) as UserRole | undefined;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = metaRole ?? (data?.role as UserRole | undefined) ?? "field_officer";

  return { userId: user.id, role };
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

  const supabase = await createClient();
  const { data } = await supabase
    .from("schedules")
    .select("user_id")
    .eq("id", scheduleId)
    .maybeSingle();

  return data?.user_id === ctx.userId;
}
