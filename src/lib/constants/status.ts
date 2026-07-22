import type { VisitStatus } from "@/types";

export const SCHEDULE_STATUSES: VisitStatus[] = [
  "pending",
  "on_the_way",
  "in_progress",
  "completed",
  "cancelled",
];

export const STATUS_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  pending: ["on_the_way", "in_progress", "cancelled"],
  on_the_way: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["in_progress"],
  cancelled: [],
};

export const STATUS_LABELS: Record<VisitStatus, string> = {
  pending: "Pending",
  on_the_way: "On The Way",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<VisitStatus, string> = {
  pending: "text-amber-500 bg-amber-50 border-amber-200",
  on_the_way: "text-blue-500 bg-blue-50 border-blue-200",
  in_progress: "text-purple-500 bg-purple-50 border-purple-200",
  completed: "text-green-500 bg-green-50 border-green-200",
  cancelled: "text-red-500 bg-red-50 border-red-200",
};

export const STATUS_DOT_COLORS: Record<VisitStatus, string> = {
  pending: "bg-amber-500",
  on_the_way: "bg-blue-500",
  in_progress: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};
