import { describe, it, expect } from "vitest";
import { STATUS_TRANSITIONS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants/status";

describe("STATUS_TRANSITIONS", () => {
  it("pending can transition to on_the_way or cancelled", () => {
    expect(STATUS_TRANSITIONS.pending).toEqual(["on_the_way", "cancelled"]);
  });

  it("on_the_way can transition to in_progress or cancelled", () => {
    expect(STATUS_TRANSITIONS.on_the_way).toEqual(["in_progress", "cancelled"]);
  });

  it("in_progress can transition to completed or cancelled", () => {
    expect(STATUS_TRANSITIONS.in_progress).toEqual(["completed", "cancelled"]);
  });

  it("completed has no transitions", () => {
    expect(STATUS_TRANSITIONS.completed).toEqual([]);
  });

  it("cancelled has no transitions", () => {
    expect(STATUS_TRANSITIONS.cancelled).toEqual([]);
  });
});

describe("STATUS_LABELS", () => {
  it("has labels for all statuses", () => {
    expect(STATUS_LABELS.pending).toBe("Pending");
    expect(STATUS_LABELS.on_the_way).toBe("On The Way");
    expect(STATUS_LABELS.in_progress).toBe("In Progress");
    expect(STATUS_LABELS.completed).toBe("Completed");
    expect(STATUS_LABELS.cancelled).toBe("Cancelled");
  });
});

describe("STATUS_COLORS", () => {
  it("has color classes for all statuses", () => {
    const statuses = ["pending", "on_the_way", "in_progress", "completed", "cancelled"];
    statuses.forEach((s) => {
      expect(STATUS_COLORS[s as keyof typeof STATUS_COLORS]).toBeDefined();
    });
  });
});
