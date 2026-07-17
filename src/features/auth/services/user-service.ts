import { createAdminClient } from "@/lib/supabase/admin-client";
import type { User } from "@/types";
import type { UserInput } from "../schema/user-schema";

export async function getUsers(): Promise<User[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (data ?? []) as unknown as User[];
}

export async function createUser(data: UserInput) {
  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: "Welcome123!",
    email_confirm: true,
    user_metadata: { name: data.name, role: data.role },
  });

  if (authError) throw authError;

  const { error: dbError } = await admin.from("users").insert({
    id: authUser.user.id,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone ?? null,
    is_active: data.is_active,
  });

  if (dbError) throw dbError;

  return authUser.user;
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  const admin = createAdminClient();

  if (data.email) {
    await admin.auth.admin.updateUserById(id, { email: data.email });
  }

  const { error } = await admin
    .from("users")
    .update(data)
    .eq("id", id);

  if (error) throw error;
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, {
    ban_duration: isActive ? "none" : "unlimited",
  });

  const { error } = await admin
    .from("users")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw error;
}
