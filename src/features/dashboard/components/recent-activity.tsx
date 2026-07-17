"use client";

import { Clock, CheckCircle2, Upload, MapPin, ArrowRightCircle, XCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/utils/date";
import type { ActivityLog } from "@/types";
import { STATUS_LABELS } from "@/lib/constants/status";

const actionIcons: Record<string, React.ElementType> = {
  schedule_completed: CheckCircle2,
  photo_uploaded: Upload,
  visit_started: MapPin,
  status_changed: ArrowRightCircle,
  schedule_cancelled: XCircle,
};

const actionLabels: Record<string, string> = {
  schedule_completed: "Menyelesaikan kunjungan",
  photo_uploaded: "Mengupload foto",
  visit_started: "Memulai kunjungan",
  status_changed: "Mengubah status",
  schedule_cancelled: "Membatalkan kunjungan",
};

interface RecentActivityProps {
  activities: ActivityLog[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Aktivitas Terbaru</h2>
        </div>
        <EmptyState
          title="Belum ada aktivitas"
          description="Aktivitas Anda akan muncul di sini"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Aktivitas Terbaru</h2>
      </div>
      <div className="divide-y">
        {activities.map((activity) => {
          const Icon = actionIcons[activity.action] ?? Clock;
          const label = actionLabels[activity.action] ?? activity.action;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-4"
            >
              <div className="mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {label}
                  {activity.metadata && "status" in activity.metadata && (
                    <span className="text-muted-foreground">
                      {" → "}
                      {STATUS_LABELS[activity.metadata.status as keyof typeof STATUS_LABELS] ?? String(activity.metadata.status)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {timeAgo(activity.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
