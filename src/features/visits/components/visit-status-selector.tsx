"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { STATUS_VALUES,  STATUS_LABELS, STATUS_TRANSITIONS, STATUS_COLORS } from "@/lib/constants/status";
import { useUpdateVisitStatus } from "@/features/schedules/hooks/use-schedules";
import type { VisitStatus } from "@/types";

interface VisitStatusSelectorProps {
  scheduleId: string;
  currentStatus: VisitStatus;
  editable?: boolean;
  /** Role user; role produksi tidak dapat memilih completed. */
  role?: string | null;
  onSuccess?: () => void;
}

const STATUS_ICONS: Record<VisitStatus, string> = {
  pending: "⏳",
  in_progress: "📋",
  gagal_partial: "⚠️",
  completed: "✅",
  gagal_total: "❌",
};

export function VisitStatusSelector({
  scheduleId,
  currentStatus,
  editable = true,
  role,
  onSuccess,
}: VisitStatusSelectorProps) {
  const [showOptions, setShowOptions] = useState(false);
  const updateStatus = useUpdateVisitStatus();
  const transitions = (STATUS_TRANSITIONS[currentStatus] ?? []).filter(
    (s) => !(s === STATUS_VALUES.completed && role === "produksi"),
  );

  async function handleStatusChange(status: VisitStatus) {
    await updateStatus.mutateAsync({ id: scheduleId, status });
    setShowOptions(false);
    onSuccess?.();
  }

  const currentLabel = STATUS_LABELS[currentStatus] ?? currentStatus;
  const currentColor = STATUS_COLORS[currentStatus] ?? "";

  if (!editable) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md ${currentColor}`}>
        {STATUS_ICONS[currentStatus]} {currentLabel}
      </span>
    );
  }

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
