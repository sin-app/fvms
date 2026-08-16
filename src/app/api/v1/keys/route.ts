import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { hashApiKey } from "@/lib/api-auth";
import { nextErrorResponse } from "@/lib/errors";
import { preflightResponse, withCors } from "@/lib/cors";
import crypto from "crypto";

function generateApiKey(): string {
  return "fvm_" + crypto.randomBytes(32).toString("hex");
}

function maskKey(key: string): string {
  return `${key.slice(0, 10)}…${key.slice(-4)}`;
}

export function OPTIONS(request: Request) {
  return preflightResponse(request);
}

export async function GET(request: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx || ctx.role !== "admin") {
      return withCors(request, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("api_keys")
      .select("id, name, key_hash, created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });

    return withCors(
      request,
      NextResponse.json({
        keys: (data ?? []).map((k) => ({
          id: k.id,
          name: k.name,
          key_masked: maskKey(k.key_hash),
          created_at: k.created_at,
        })),
      }),
    );
  } catch (err) {
    return withCors(request, nextErrorResponse(err));
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx || ctx.role !== "admin") {
      return withCors(request, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    let name: string;
    try {
      const body = await request.json();
      name = body?.name;
    } catch {
      return withCors(request, NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }));
    }
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return withCors(
        request,
        NextResponse.json({ error: "Name is required (max 100 chars)" }, { status: 400 }),
      );
    }

    const admin = createAdminClient();
    const key = generateApiKey();

    const { data, error } = await admin
      .from("api_keys")
      .insert({ user_id: ctx.userId, name: name.trim(), key_hash: hashApiKey(key) })
      .select("id, name, created_at")
      .single();

    if (error) {
      return withCors(
        request,
        NextResponse.json({ error: "Gagal membuat API key" }, { status: 500 }),
      );
    }

    return withCors(
      request,
      NextResponse.json({ key: { ...data, key_value: key } }),
    );
  } catch (err) {
    return withCors(request, nextErrorResponse(err));
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx || ctx.role !== "admin") {
      return withCors(request, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return withCors(request, NextResponse.json({ error: "id is required" }, { status: 400 }));
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("api_keys")
      .delete()
      .eq("id", id)
      .eq("user_id", ctx.userId);

    if (error) {
      return withCors(
        request,
        NextResponse.json({ error: "Gagal menghapus API key" }, { status: 500 }),
      );
    }

    return withCors(request, NextResponse.json({ success: true }));
  } catch (err) {
    return withCors(request, nextErrorResponse(err));
  }
}
