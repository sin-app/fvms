import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { KabupatenTable } from "@/features/master-data/components/kabupaten-table";

export default async function KabupatenPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <KabupatenTable />;
}
