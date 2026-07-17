"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_TRANSITIONS } from "@/lib/constants/status";
import { STATUS_COLORS } from "@/lib/constants/status";
import { useUpdateVisitStatus } from "@/features/schedules/hooks/use-schedules";
import type { VisitStatus } from "@/types";

interface VisitStatusSelectorProps {
  scheduleId: string;
  currentStatus: VisitStatus;
  onSuccess?: () => void;
}

const STATUS_ICONS: Record<VisitStatus, string> = {
  pending: "⏳",
  on_the_way: "🚗",
  in_progress: "📋",
  completed: "✅",
  cancelled: "❌",
};

export function VisitStatusSelector({
  scheduleId,
  currentStatus,
  onSuccess,
}: VisitStatusSelectorProps) {
  const [showOptions, setShowOptions] = useState(false);
  const updateStatus = useUpdateVisitStatus();
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  async function handleStatusChange(status: VisitStatus) {
    await updateStatus.mutateAsync({ id: scheduleId, status });
    setShowOptions(false);
    onSuccess?.();
  }

  const currentLabel = STATUS_LABELS[currentStatus] ?? currentStatus;
  const currentColor = STATUS_COLORS[currentStatus] ?? "";

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        className={currentColor}
      >
        {STATUS_ICONS[currentStatus]} {currentLabel}
      </Button>

      {showOptions && (
        <div className="absolute top-full mt-1 left-0 bg-popover border rounded-lg shadow-lg z-50 min-w-[180px]">
          <div className="p-1">
            {transitions.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">
                Tidak ada transisi status yang tersedia
              </p>
            )}
            {transitions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updateStatus.isPending}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                {STATUS_ICONS[status]} {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
