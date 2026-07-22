import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { ImportPageInner } from "./import-page-client";

export default async function ImportPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <ImportPageInner />;
}
