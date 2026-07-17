import { describe, it, expect } from "vitest";
import { visitNotesSchema, visitStatusSchema } from "@/features/visits/schema/visit-schema";

describe("visitNotesSchema", () => {
  it("validates with only schedule_id", () => {
    const result = visitNotesSchema.parse({ schedule_id: "sched-1" });
    expect(result.schedule_id).toBe("sched-1");
  });

  it("validates with all fields", () => {
    const result = visitNotesSchema.parse({
      schedule_id: "sched-1",
      observation: "Good",
      problem: "None",
      recommend: "Continue",
      additional: "All clear",
    });
    expect(result.observation).toBe("Good");
    expect(result.additional).toBe("All clear");
  });

  it("rejects missing schedule_id", () => {
    expect(() => visitNotesSchema.parse({})).toThrow();
  });
});

describe("visitStatusSchema", () => {
  it("validates a valid status transition", () => {
    const result = visitStatusSchema.parse({
      id: "sched-1",
      status: "in_progress",
    });
    expect(result.status).toBe("in_progress");
  });

  it("rejects invalid status", () => {
    expect(() =>
      visitStatusSchema.parse({ id: "sched-1", status: "invalid_status" }),
    ).toThrow();
  });

  it("accepts optional GPS coordinates", () => {
    const result = visitStatusSchema.parse({
      id: "sched-1",
      status: "in_progress",
      latitude: -6.2,
      longitude: 106.8,
      accuracy: 10,
    });
    expect(result.latitude).toBe(-6.2);
  });
});
