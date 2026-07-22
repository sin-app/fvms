"use client";

import { useAuth } from "@/features/auth/components/auth-context";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { NotificationPrefs } from "@/features/settings/components/notification-prefs";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState variant="card" />;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <PageHeader title="Pengaturan" description="Kelola pengaturan akun dan preferensi Anda" />
        <p className="text-sm text-muted-foreground">Silakan login untuk mengatur akun.</p>
      </div>
    );
  }

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

      <section className="rounded-xl border bg-card p-6">
        <LogoutButton />
      </section>
    </div>
  );
}
