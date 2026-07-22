import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  getAuthContext: vi.fn(async () => ({
    userId: "admin-1",
    role: "admin",
    assignedKabupatenIds: [],
  })),
  qcKabupatenScope: vi.fn((ctx: { role: string; assignedKabupatenIds: string[] }) =>
    ctx.role === "qc" ? ctx.assignedKabupatenIds : null,
  ),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getReportData, getReportRows, exportToExcel } from "@/features/reports/services/report-service";

function buildQuery(response: unknown) {
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown) => void) => resolve(response),
    catch: () => {},
    finally: () => {},
  };
  const methods = ["select", "is", "gte", "lte", "eq", "order", "range", "limit"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  Object.setPrototypeOf(chain, {
    then: (resolve: (v: unknown) => void) => resolve(response),
  });
  return chain as unknown as ReturnType<ReturnType<typeof createAdminClient>["from"]>;
}

describe("report-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getReportData", () => {
    it("returns aggregated report data", async () => {
      const mockData = [
        { status: "completed", visit_date: "2024-01-01", user_id: "u1", kabupaten_id: "k1", user: { name: "John" }, kabupaten: { name: "Kab A" }, visit_time: null },
        { status: "pending", visit_date: "2024-01-02", user_id: "u1", kabupaten_id: "k1", user: { name: "John" }, kabupaten: { name: "Kab A" }, visit_time: null },
        { status: "completed", visit_date: "2024-01-05", user_id: "u2", kabupaten_id: "k2", user: { name: "Jane" }, kabupaten: { name: "Kab B" }, visit_time: null },
      ];

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn(() => buildQuery({ data: mockData, error: null, count: 3 })),
      });

      const result = await getReportData({ date_from: "2024-01-01", date_to: "2024-12-31" });
      expect(result.total_schedules).toBe(3);
      expect(result.completed).toBe(2);
      expect(result.pending).toBe(1);
    });

    it("returns defaults for no data", async () => {
      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn(() => buildQuery({ data: null })),
      });

      const result = await getReportData({ date_from: "2024-01-01", date_to: "2024-12-31" });
      expect(result.total_schedules).toBe(0);
      expect(result.completed).toBe(0);
    });
  });

  describe("getReportRows", () => {
    it("handles null data", async () => {
      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn(() => buildQuery({ data: null })),
      });

      const result = await getReportRows({ date_from: "2024-01-01", date_to: "2024-12-31" });
      expect(result).toEqual([]);
    });

    it("handles empty data", async () => {
      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn(() => buildQuery({ data: [] })),
      });

      const result = await getReportRows({ date_from: "2024-01-01", date_to: "2024-12-31" });
      expect(result).toEqual([]);
    });
  });

  describe("exportToExcel", () => {
    it("generates output for valid rows", async () => {
      const rows = [
        {
          id: "1", visit_date: "2024-01-01", status: "completed", visit_time: null,
          user_name: "John", kabupaten_name: "Kab A", kecamatan_name: "Kec B", desa_name: "Desa C",
          has_notes: false,
        },
      ];
      const result = await exportToExcel(rows);
      expect(result.byteLength).toBeGreaterThan(0);
    });

    it("generates output for empty rows", async () => {
      const result = await exportToExcel([]);
      expect(result.byteLength).toBeGreaterThan(0);
    });
  });
});
