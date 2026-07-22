import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/authorization";
import { UsersPageInner } from "./users-page-client";

export default async function UsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return <UsersPageInner />;
}
