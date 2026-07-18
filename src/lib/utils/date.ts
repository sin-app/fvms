import { format, formatDistanceToNow, isBefore, isToday, parseISO, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import type { VisitStatus } from "@/types";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMMM yyyy", { locale: id });
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy", { locale: id });
}

export function formatDateDay(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, dd MMMM yyyy", { locale: id });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMMM yyyy HH:mm", { locale: id });
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: id });
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

export function isLate(visitDate: string, status: VisitStatus): boolean {
  if (status === "completed" || status === "cancelled") return false;
  return isBefore(startOfDay(parseISO(visitDate)), startOfDay(new Date()));
}

export function isTodayDate(visitDate: string): boolean {
  return isToday(parseISO(visitDate));
}
