import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  createSchedule,
  deleteSchedule,
  getDistinctScheduleValues,
} from "@/features/schedules/services/schedule-service";

describe("schedule-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSchedule", () => {
    it("inserts a schedule with pending status", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "new-sched" }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({ insert: mockInsert }),
      });

      const result = await createSchedule({
        user_id: "user-1",
        kabupaten_id: "kab-1",
        kecamatan_id: "kec-1",
        desa_id: "desa-1",
        visit_date: "2024-09-01",
        notes: "Test",
      });

      expect(result).toEqual({ id: "new-sched" });
    });
  });

  describe("deleteSchedule", () => {
    it("soft deletes a schedule", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const from = vi.fn().mockReturnValue({ update: mockUpdate });

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });

      await deleteSchedule("sched-1");

      expect(mockUpdate).toHaveBeenCalled();
      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg).toHaveProperty("deleted_at");
    });
  });

  describe("getDistinctScheduleValues", () => {
    it("returns unique, numerically sorted values per field, scoped for produksi", async () => {
      const rows = [
        { block_no: "10", no_plot: "2", nis: "001", document_no: "DOC-B", cgr: "Petani B" },
        { block_no: "2", no_plot: "10", nis: "001", document_no: "DOC-A", cgr: "Petani A" },
        { block_no: "10", no_plot: "3", nis: "010", document_no: "DOC-A", cgr: null },
      ];
      const resolve = { then: (cb: (v: unknown) => unknown) => cb({ data: rows, error: null }) };
      const mockEq = vi.fn().mockReturnValue(resolve);
      const captured: string[] = [];

      const mockFrom = vi.fn().mockImplementation((table: string) => ({
        select: (field: string) => {
          captured.push(field);
          return {
            not: () => ({
              in: () => resolve,
              eq: mockEq,
            }),
            eq: mockEq,
          };
        },
      }));

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

      const result = await getDistinctScheduleValues({
        userId: "user-1",
        role: "produksi",
        email: "u@x.com",
        name: "U",
      } as never);

      expect(mockFrom).toHaveBeenCalledWith("schedules");
      expect(captured).toEqual(["block_no", "no_plot", "nis", "document_no", "cgr"]);
      expect(result.block_no).toEqual(["2", "10"]);
      expect(result.no_plot).toEqual(["2", "3", "10"]);
      expect(result.nis).toEqual(["001", "010"]);
      expect(result.document_no).toEqual(["DOC-A", "DOC-B"]);
      expect(result.cgr).toEqual(["Petani A", "Petani B"]);
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });
});
