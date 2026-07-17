import { describe, it, expect } from "vitest";
import { scheduleSchema, scheduleFilterSchema } from "@/features/schedules/schema/schedule-schema";

describe("scheduleSchema", () => {
  it("validates a correct schedule input", () => {
    const result = scheduleSchema.parse({
      user_id: "user-1",
      kabupaten_id: "kab-1",
      kecamatan_id: "kec-1",
      desa_id: "desa-1",
      visit_date: "2024-08-15",
      notes: "some notes",
    });
    expect(result.user_id).toBe("user-1");
    expect(result.notes).toBe("some notes");
  });

  it("accepts input without optional notes", () => {
    const result = scheduleSchema.parse({
      user_id: "user-1",
      kabupaten_id: "kab-1",
      kecamatan_id: "kec-1",
      desa_id: "desa-1",
      visit_date: "2024-08-15",
    });
    expect(result.notes).toBeUndefined();
  });

  it("rejects missing user_id", () => {
    expect(() =>
      scheduleSchema.parse({
        kabupaten_id: "kab-1",
        kecamatan_id: "kec-1",
        desa_id: "desa-1",
        visit_date: "2024-08-15",
      }),
    ).toThrow();
  });

  it("rejects empty visit_date", () => {
    expect(() =>
      scheduleSchema.parse({
        user_id: "user-1",
        kabupaten_id: "kab-1",
        kecamatan_id: "kec-1",
        desa_id: "desa-1",
        visit_date: "",
      }),
    ).toThrow();
  });
});

describe("scheduleFilterSchema", () => {
  it("provides default page and pageSize", () => {
    const result = scheduleFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("parses string numbers for page", () => {
    const result = scheduleFilterSchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });

  it("accepts optional search", () => {
    const result = scheduleFilterSchema.parse({ search: "test" });
    expect(result.search).toBe("test");
  });
});
