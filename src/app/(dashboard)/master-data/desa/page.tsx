import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { DesaTable } from "@/features/master-data/components/desa-table";

export default async function DesaPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <DesaTable />;
}
