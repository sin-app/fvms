import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { hashApiKey } from "@/lib/api-auth";
import crypto from "crypto";

function generateApiKey(): string {
  return "fvm_" + crypto.randomBytes(32).toString("hex");
}

function maskKey(key: string): string {
  return `${key.slice(0, 10)}…${key.slice(-4)}`;
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("api_keys")
    .select("id, name, key_hash, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  // Jangan pernah menampilkan key penuh — hanya versi ter-mask.
  return NextResponse.json({
    keys: (data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      key_masked: maskKey(k.key_hash),
      created_at: k.created_at,
    })),
  });
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name: string;
  try {
    const body = await req.json();
    name = body?.name;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    return NextResponse.json({ error: "Name is required (max 100 chars)" }, { status: 400 });
  }

  const admin = createAdminClient();
  const key = generateApiKey();

  const { data, error } = await admin
    .from("api_keys")
    .insert({ user_id: ctx.userId, name: name.trim(), key_hash: hashApiKey(key) })
    .select("id, name, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Gagal membuat API key" }, { status: 500 });
  }

  // Key penuh hanya dikembalikan SEKALI saat dibuat.
  return NextResponse.json({ key: { ...data, key_value: key } });
}

export async function DELETE(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.userId);

  if (error) {
    return NextResponse.json({ error: "Gagal menghapus API key" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
