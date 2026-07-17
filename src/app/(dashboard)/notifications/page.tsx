"use client";

import { PageHeader } from "@/components/shared/page-header";
import { NotificationList } from "@/features/notifications";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan dan pengingat jadwal kunjungan"
      />
      <div className="rounded-xl border p-5">
        <NotificationList />
      </div>
    </div>
  );
}
