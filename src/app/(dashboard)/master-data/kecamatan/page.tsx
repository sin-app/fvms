import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { KecamatanTable } from "@/features/master-data/components/kecamatan-table";

export default async function KecamatanPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <KecamatanTable />;
}
