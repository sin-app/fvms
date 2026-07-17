import { describe, it, expect } from "vitest";
import { formatDate, formatDateShort, formatDateTime, formatTime, timeAgo, isLate, isTodayDate } from "@/lib/utils/date";

describe("formatDate", () => {
  it("formats ISO date to Indonesian long format", () => {
    expect(formatDate("2024-07-15")).toBe("15 Juli 2024");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });
});

describe("formatDateShort", () => {
  it("formats ISO date to short Indonesian format", () => {
    expect(formatDateShort("2024-07-15")).toBe("15 Jul 2024");
  });

  it("returns empty string for null", () => {
    expect(formatDateShort(null)).toBe("");
  });
});

describe("formatDateTime", () => {
  it("includes time in output", () => {
    const result = formatDateTime("2024-07-15T08:30:00");
    expect(result).toContain("2024");
    expect(result).toContain(":30");
  });
});

describe("formatTime", () => {
  it("extracts time from ISO string", () => {
    expect(formatTime("2024-07-15T08:30:00")).toBe("08:30");
  });
});

describe("timeAgo", () => {
  it("returns relative time", () => {
    const recent = new Date().toISOString();
    const result = timeAgo(recent);
    expect(result).toContain("kurang dari");
  });
});

describe("isLate", () => {
  it("returns true for past date with pending status", () => {
    expect(isLate("2020-01-01", "pending")).toBe(true);
  });

  it("returns false for completed status regardless of date", () => {
    expect(isLate("2020-01-01", "completed")).toBe(false);
  });

  it("returns false for cancelled status", () => {
    expect(isLate("2020-01-01", "cancelled")).toBe(false);
  });

  it("returns false for future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const dateStr = future.toISOString().split("T")[0];
    expect(isLate(dateStr, "pending")).toBe(false);
  });
});

describe("isTodayDate", () => {
  it("returns true for today", () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    expect(isTodayDate(`${y}-${m}-${d}`)).toBe(true);
  });

  it("returns false for other date", () => {
    expect(isTodayDate("2020-01-01")).toBe(false);
  });
});
