import { createClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { logger } from "@/lib/logger";

export type UserRole = "admin" | "qc" | "produksi";

export interface AuthContext {
  userId: string;
  role: UserRole;
  assignedKabupatenIds: string[];
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

  // Read role + assigned kabupaten from the database (source of truth).
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("role, assigned_kabupaten_ids")
      .eq("id", userId)
      .maybeSingle();
    const role = (data?.role as UserRole | undefined) ?? metaRole ?? "produksi";
    const assignedKabupatenIds = Array.isArray(data?.assigned_kabupaten_ids)
      ? (data!.assigned_kabupaten_ids as string[])
      : [];
    return { userId, role, assignedKabupatenIds };
  } catch {
    const role = metaRole ?? "produksi";
    return { userId, role, assignedKabupatenIds: [] };
  }
}

export function isPrivileged(role: UserRole): boolean {
  return role === "admin" || role === "qc";
}

/**
 * Returns the kabupaten ids a QC is allowed to see, or null when no scoping
 * applies (admin, or produksi which is scoped by user instead).
 * For QC with an empty assignment, returns an empty array (no access).
 */
export function qcKabupatenScope(ctx: AuthContext): string[] | null {
  if (ctx.role !== "qc") return null;
  return ctx.assignedKabupatenIds ?? [];
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Unauthorized");
  if (ctx.role !== "admin") throw new Error("Hanya admin yang diizinkan");
  return ctx;
}

/**
 * Central access check for a single schedule.
 *
 * SECURITY NOTE: all schedule mutations run through the Supabase service-role
 * client, which BYPASSES row-level security. Therefore this server-side check
 * is the ONLY enforcement of ownership/role scoping. Never skip it, and always
 * call it (or `assertScheduleAccess`) before reading or writing a schedule row.
 */
export async function canAccessSchedule(
  scheduleId: string,
  ctx: AuthContext,
): Promise<boolean> {
  if (isPrivileged(ctx.role)) {
    // QC is restricted to schedules within their assigned kabupaten.
    const scope = qcKabupatenScope(ctx);
    if (scope === null) return true;
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("schedules")
        .select("kabupaten_id")
        .eq("id", scheduleId)
        .maybeSingle();
      if (error) {
        logger.error("canAccessSchedule: schedule lookup failed", {
          scheduleId,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return false;
      }
      return !!data && scope.includes(data.kabupaten_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("canAccessSchedule: unexpected error", { scheduleId, error: msg });
      return false;
    }
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("schedules")
      .select("user_id")
      .eq("id", scheduleId)
      .maybeSingle();

    if (error) {
      logger.error("canAccessSchedule: schedule lookup failed", {
        scheduleId,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    return data?.user_id === ctx.userId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("canAccessSchedule: unexpected error", { scheduleId, error: msg });
    return false;
  }
}

/**
 * Throws when the context is missing or cannot access the schedule.
 * Use at the top of server actions that mutate a schedule to fail closed.
 */
export async function assertScheduleAccess(
  scheduleId: string,
  ctx: AuthContext | null,
): Promise<void> {
  if (!ctx) throw new Error("Unauthorized");
  if (!(await canAccessSchedule(scheduleId, ctx))) {
    throw new Error("Tidak memiliki akses ke jadwal ini");
  }
}
