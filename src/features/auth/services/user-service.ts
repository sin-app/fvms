import { createAdminClient } from "@/lib/supabase/admin-client";
import type { User } from "@/types";
import type { UserInput } from "../schema/user-schema";

function randomPassword(length = 16): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export async function createAuthUser(params: {
  id: string;
  email: string;
  name: string;
  role: UserInput["role"];
  password?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    id: params.id,
    email: params.email,
    password: params.password ?? randomPassword(),
    email_confirm: true,
    user_metadata: { name: params.name, role: params.role },
    app_metadata: { role: params.role },
  });
  if (error) throw error;
  if (data.user) {
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role: params.role },
    });
  }
}

export async function userHasAuthAccount(id: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error) return false;
  return !!data.user;
}

export async function setPassword(id: string, password: string): Promise<void> {
  const admin = createAdminClient();
  // Ensure the auth account exists; if not, create one from the DB user row.
  const { data: existing, error } = await admin.auth.admin.getUserById(id);
  if (error || !existing.user) {
    const { data: dbUser } = await admin
      .from("users")
      .select("email, name, role")
      .eq("id", id)
      .single();
    if (!dbUser) throw new Error("Pengguna tidak ditemukan");
    await createAuthUser({
      id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserInput["role"],
      password,
    });
    return;
  }
  const { error: updErr } = await admin.auth.admin.updateUserById(id, {
    password,
  });
  if (updErr) throw updErr;
}

export async function createUserWithPassword(
  data: UserInput & { password?: string },
): Promise<{ id: string }> {
  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password ?? randomPassword(),
    email_confirm: true,
    user_metadata: { name: data.name, role: data.role },
    app_metadata: { role: data.role },
  });
  if (error) throw error;
  const id = created.user.id;

  const { error: dbError } = await admin.from("users").insert({
    id,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone ?? null,
    is_active: data.is_active,
  });
  if (dbError) throw dbError;

  return { id };
}

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
