import { format, formatDistanceToNow, isBefore, isToday, parseISO, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
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
  if (status === "completed" || status === "gagal_total") return false;
  return isBefore(startOfDay(parseISO(visitDate)), startOfDay(new Date()));
}

export function isTodayDate(visitDate: string): boolean {
  return isToday(parseISO(visitDate));
}

export function todayString(): string {
  return dateString(new Date());
}

export function firstOfMonthString(): string {
  return startOfMonth(new Date()).toISOString().split("T")[0];
}

export function lastOfMonthString(): string {
  return endOfMonth(new Date()).toISOString().split("T")[0];
}

export function weekStartString(): string {
  return startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
}

export function weekEndString(): string {
  return endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
}

export function tomorrowString(): string {
  return addDays(new Date(), 1).toISOString().split("T")[0];
}

export function dateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
