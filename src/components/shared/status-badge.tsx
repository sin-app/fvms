import type { VisitStatus } from "@/types";
import { STATUS_LABELS, STATUS_DOT_COLORS } from "@/lib/constants/status";

interface StatusBadgeProps {
  status: VisitStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const dotColor = STATUS_DOT_COLORS[status];
  const label = STATUS_LABELS[status];

  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}
