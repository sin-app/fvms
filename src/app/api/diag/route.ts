import { NextResponse } from "next/server";
import { createMasterUpserter } from "@/features/excel-import/services/master-upsert";

export const dynamic = "force-dynamic";

export async function GET() {
  const ups = createMasterUpserter();
  const res = await ups.resolveAll([
    { kab: "KEDIRI", kec: "NGADILUWIH", desa: "BADAL PANDEAN" },
    { kab: "KEDIRI", kec: "PESANTREN", desa: "TOSAREN" },
  ]);
  return NextResponse.json({
    created: res.created,
    kabCount: res.kabupaten.size,
    kecCount: res.kecamatan.size,
    desaCount: res.desa.size,
  });
}
