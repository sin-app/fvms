import { describe, it, expect } from "vitest";
import { STATUS_TRANSITIONS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants/status";

describe("STATUS_TRANSITIONS", () => {
  it("pending can transition to in_progress, completed, or gagal_total", () => {
    expect(STATUS_TRANSITIONS.pending).toEqual(["in_progress", "completed", "gagal_total"]);
  });

  it("in_progress can transition to completed or gagal_total", () => {
    expect(STATUS_TRANSITIONS.in_progress).toEqual(["completed", "gagal_total"]);
  });

  it("completed can transition to in_progress", () => {
    expect(STATUS_TRANSITIONS.completed).toEqual(["in_progress"]);
  });

  it("gagal_total has no transitions", () => {
    expect(STATUS_TRANSITIONS.gagal_total).toEqual([]);
  });
});

describe("STATUS_LABELS", () => {
  it("has labels for all statuses", () => {
    expect(STATUS_LABELS.pending).toBe("Pending");
    expect(STATUS_LABELS.in_progress).toBe("In Progress");
    expect(STATUS_LABELS.completed).toBe("Completed");
    expect(STATUS_LABELS.gagal_total).toBe("Gagal Total");
  });
});

describe("STATUS_COLORS", () => {
  it("has color classes for all statuses", () => {
    const statuses = ["pending", "in_progress", "completed", "gagal_total"];
    statuses.forEach((s) => {
      expect(STATUS_COLORS[s as keyof typeof STATUS_COLORS]).toBeDefined();
    });
  });
});
