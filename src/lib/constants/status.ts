import type { VisitStatus } from "@/types";

export const SCHEDULE_STATUSES: VisitStatus[] = [
  "pending",
  "in_progress",
  "gagal_partial",
  "completed",
  "gagal_total",
];

export const STATUS_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  pending: ["in_progress", "gagal_partial", "completed", "gagal_total"],
  in_progress: ["gagal_partial", "completed", "gagal_total"],
  gagal_partial: ["completed", "gagal_total"],
  completed: ["in_progress"],
  gagal_total: [],
};

export const STATUS_LABELS: Record<VisitStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  gagal_partial: "Gagal Partial",
  completed: "Completed",
  gagal_total: "Gagal Total",
};

export const STATUS_COLORS: Record<VisitStatus, string> = {
  pending: "text-amber-500 bg-amber-50 border-amber-200",
  in_progress: "text-yellow-600 bg-yellow-50 border-yellow-200",
  gagal_partial: "text-orange-500 bg-orange-50 border-orange-200",
  completed: "text-green-500 bg-green-50 border-green-200",
  gagal_total: "text-red-500 bg-red-50 border-red-200",
};

export const STATUS_DOT_COLORS: Record<VisitStatus, string> = {
  pending: "bg-amber-500",
  in_progress: "bg-yellow-500",
  gagal_partial: "bg-orange-500",
  completed: "bg-green-500",
  gagal_total: "bg-red-500",
};
