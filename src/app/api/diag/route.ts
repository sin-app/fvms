import { NextResponse } from "next/server";
import { createMasterUpserter } from "@/features/excel-import/services/master-upsert";

export const dynamic = "force-dynamic";

export async function GET() {
  const ups = createMasterUpserter();
  const res = await ups.resolveAll([
    { kab: "KEDIRI", kec: "NGADILUWIH", desa: "BADAL PANDEAN" },
  ]);
  return NextResponse.json({ debug: res.debug, created: res.created });
}
