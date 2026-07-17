import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Profile"
        description="Kelola informasi akun Anda"
      />

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <ProfileForm user={user} />
      </div>
    </div>
  );
}
