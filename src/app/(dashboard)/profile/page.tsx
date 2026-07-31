"use client";

import Link from "next/link";
import { ChevronRight, Settings } from "lucide-react";
import { useAuth } from "@/features/auth/components/auth-context";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState variant="card" />;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Profile" description="Kelola informasi akun Anda" />
        <p className="text-sm text-muted-foreground">Silakan login untuk melihat profil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Profile"
        description="Kelola informasi akun Anda"
      />

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {(user.name?.[0] ?? "?").toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <ProfileForm user={user} />
      </div>

      <div className="mt-4 rounded-xl border bg-card divide-y">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          Pengaturan
          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
