import { createAdminClient } from "@/lib/supabase/admin-client";
import type { User } from "@/types";
import type { UserInput } from "../schema/user-schema";

export async function getUsers(): Promise<User[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("*")
    .order("name", { ascending: true });

  return (data ?? []) as unknown as User[];
}

export async function createUser(data: UserInput) {
  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    data.email,
    { data: { name: data.name, role: data.role } },
  );

  if (inviteError) throw inviteError;

  const { error: metaError } = await admin.auth.admin.updateUserById(invite.user.id, {
    app_metadata: { role: data.role },
    user_metadata: { role: data.role, name: data.name },
  });
  if (metaError) throw metaError;

  const { error: dbError } = await admin.from("users").insert({
    id: invite.user.id,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone ?? null,
    is_active: data.is_active,
  });

  if (dbError) throw dbError;

  return invite.user;
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  const admin = createAdminClient();

  if (data.email) {
    await admin.auth.admin.updateUserById(id, { email: data.email });
  }

  if (data.role) {
    await admin.auth.admin.updateUserById(id, {
      app_metadata: { role: data.role },
      user_metadata: { role: data.role },
    });
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
