import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  createSchedule,
  deleteSchedule,
  getScheduleList,
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

  describe("getScheduleList", () => {
    it("filters block_no with in() for multi-select values", async () => {
      const mockIn = vi.fn().mockImplementation(() => chain);
      const mockThen = vi.fn().mockImplementation((cb: (v: unknown) => unknown) =>
        cb({ data: [], error: null, count: 0 }),
      );
      const chain: Record<string, unknown> = {
        eq: () => chain,
        ilike: () => chain,
        like: () => chain,
        not: () => chain,
        lt: () => chain,
        is: () => chain,
        order: () => chain,
        range: () => chain,
        in: mockIn,
        then: mockThen,
      };

            (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockImplementation(() => ({
          select: () => chain,
        })),
      });

      await getScheduleList(
        "all",
        { block_no: ["10", "2"] },
        { userId: "a1", role: "admin", email: "a@x.com", name: "A" } as never,
      );

      expect(mockIn).toHaveBeenCalledWith("block_no", ["10", "2"]);
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

    it("applies relations: other active filters constrain options, self field excluded", async () => {
      const rows = [{ block_no: "10", no_plot: "2", nis: "001", document_no: "DOC-B", cgr: "Petani B" }];
      const calls: [string, unknown][] = [];
      const chain: Record<string, unknown> = {
        eq: (c: string, v: unknown) => {
          calls.push([c, v]);
          return chain;
        },
        in: (c: string, v: unknown) => {
          calls.push([c, v]);
          return chain;
        },
        not: () => chain,
        ilike: (c: string, p: unknown) => {
          calls.push([c, p]);
          return chain;
        },
        like: (c: string, p: unknown) => {
          calls.push([c, p]);
          return chain;
        },
        then: (cb: (v: unknown) => unknown) => cb({ data: rows, error: null }),
      };

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({ select: () => ({ not: () => chain }) }),
      });

      await getDistinctScheduleValues(
        { userId: "admin-1", role: "admin", email: "a@x.com", name: "A" } as never,
        {
          block_no: ["10", "2"],
          no_plot: "2",
          nis: "001",
          document_no: "DOC-B",
          cgr: "Petani B",
          desa_id: "desa-9",
          member_name: "Budi",
          varietas: "JP-06",
        },
      );

      const count = (col: string) => calls.filter(([c]) => c === col).length;
      // Block multi-select -> in, diterapkan di 4 query lain (self-excluded)
      expect(count("block_no")).toBe(4);
      expect(calls.filter(([c, v]) => c === "block_no").some(([, v]) => Array.isArray(v) && (v as string[]).length === 2)).toBe(true);
      // Kolom data lain tetap eq, dibatasi 4 filter lain (self-excluded)
      expect(count("no_plot")).toBe(4);
      expect(count("nis")).toBe(4);
      expect(count("cgr")).toBe(4);
      // Region diterapkan di semua 5 query
      expect(count("desa_id")).toBe(5);
      expect(count("kabupaten_id")).toBe(0);
      expect(count("user_id")).toBe(0);
      expect(calls.filter(([c]) => c === "member_name").length).toBe(5);
      expect(calls.filter(([c]) => c === "document_no").length).toBeGreaterThan(0);
      // member_name via ilike + varietas via like document_no, escaped
      expect(
        calls.some(
          ([c, v]) => c === "member_name" && typeof v === "string" && v.includes("%Budi%"),
        ),
      ).toBe(true);
      expect(
        calls.some(
          ([c, v]) => c === "document_no" && typeof v === "string" && v.includes("JP-06"),
        ),
      ).toBe(true);
    });
  });
});
