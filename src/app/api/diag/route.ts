import { NextResponse } from "next/server";
import { createMasterUpserter } from "@/features/excel-import/services/master-upsert";

export const dynamic = "force-dynamic";

export async function GET() {
  const out: Record<string, unknown> = {};
  try {
    const ups = createMasterUpserter();
    const res = await ups.resolveAll([
      { kab: "KEDIRI", kec: "NGADILUWIH", desa: "BADAL PANDEAN" },
      { kab: "KEDIRI", kec: "PESANTREN", desa: "TOSAREN" },
    ]);
    out.master = {
      created: res.created,
      kabCount: res.kabupaten.size,
      kecCount: res.kecamatan.size,
      desaCount: res.desa.size,
      kabSample: Array.from(res.kabupaten.entries()).slice(0, 3),
      kecSample: Array.from(res.kecamatan.entries()).slice(0, 3),
    };
  } catch (e) {
    out.masterThrow = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json(out);
}
