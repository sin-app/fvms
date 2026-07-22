import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin-client";
import crypto from "crypto";

function generateApiKey(): string {
  return "fvm_" + crypto.randomBytes(32).toString("hex");
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("api_keys")
    .select("id, name, key, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ keys: data ?? [] });
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const key = generateApiKey();

  const { data, error } = await admin
    .from("api_keys")
    .insert({ user_id: ctx.userId, name: name.trim(), key })
    .select("id, name, key, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key: data });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
