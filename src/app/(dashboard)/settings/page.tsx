import { createClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { NotificationPrefs } from "@/features/settings/components/notification-prefs";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";

export default async function SettingsPage() {
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
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Pengaturan"
        description="Kelola pengaturan akun dan preferensi Anda"
      />

      <section className="rounded-xl border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <ProfileForm user={user} />
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Notifikasi</h2>
        <NotificationPrefs />
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Tampilan</h2>
        <AppearanceSettings />
      </section>
    </div>
  );
}
