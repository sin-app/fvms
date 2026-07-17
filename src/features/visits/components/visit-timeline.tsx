"use client";

import { useVisitTimeline } from "../hooks/use-visit";
import { LoadingState } from "@/components/shared/loading-state";
import { timeAgo } from "@/lib/utils/date";

interface VisitTimelineProps {
  scheduleId: string;
}

const ACTION_LABELS: Record<string, string> = {
  status_changed: "Status berubah",
  notes_saved: "Catatan disimpan",
  photo_uploaded: "Foto diupload",
  created: "Jadwal dibuat",
};

export function VisitTimeline({ scheduleId }: VisitTimelineProps) {
  const { data: logs, isLoading } = useVisitTimeline(scheduleId);

  if (isLoading) return <LoadingState variant="list" count={3} />;

  if (!logs?.length) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Belum ada aktivitas
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => (
        <div key={log.id} className="flex gap-3 pb-4 relative">
          {i < logs.length - 1 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
          )}
          <div className="w-[15px] h-[15px] rounded-full bg-primary/20 border-2 border-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {ACTION_LABELS[log.action] ?? log.action}
            </p>
            <p className="text-xs text-muted-foreground">
              {log.user?.name ?? "Sistem"} &middot; {timeAgo(log.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
