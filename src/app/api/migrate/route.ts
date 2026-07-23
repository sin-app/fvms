import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const admin = createAdminClient();
    const sqlPath = path.join(process.cwd(), "supabase/migrations/010_add_panen.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    const results: string[] = [];

    for (const stmt of statements) {
      try {
        const { error } = await admin.rpc("exec_sql", { sql_text: stmt + ";" });
        if (error) {
          results.push(`ERROR: ${stmt.substring(0, 60)}... → ${error.message}`);
        } else {
          results.push(`OK: ${stmt.substring(0, 60)}...`);
        }
      } catch {
        // exec_sql doesn't exist, fallback to raw query
        const { error } = await admin.from("_migration_runner").insert({ sql: stmt + ";" }).single();
        if (error) {
          results.push(`FALLBACK: ${stmt.substring(0, 60)}... → ${error.message}`);
        } else {
          results.push(`OK (fallback): ${stmt.substring(0, 60)}...`);
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}
