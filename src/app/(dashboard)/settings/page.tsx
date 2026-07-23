"use client";

import { useAuth } from "@/features/auth/components/auth-context";
import { LogoutButton } from "@/features/auth";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { NotificationPrefs } from "@/features/settings/components/notification-prefs";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { LanguageSwitcher } from "@/features/settings/components/language-switcher";
import { ApiKeyManager } from "@/features/settings/components/api-key-manager";

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

      <section className="rounded-xl border bg-card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Bahasa</h2>
        <LanguageSwitcher />
      </section>

      {user.role === "admin" && (
        <section className="rounded-xl border bg-card p-6 space-y-6">
          <h2 className="text-lg font-semibold">API Key</h2>
          <p className="text-sm text-muted-foreground">
            Gunakan API Key untuk mengakses data melalui REST API. Simpan key dengan aman — tidak bisa dilihat lagi setelah dibuat.
          </p>
          <ApiKeyManager />
        </section>
      )}

      <section className="rounded-xl border bg-card p-6">
        <LogoutButton />
      </section>
    </div>
  );
}
