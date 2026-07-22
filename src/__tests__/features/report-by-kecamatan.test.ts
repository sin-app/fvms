import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  getAuthContext: vi.fn(),
  qcKabupatenScope: vi.fn(() => null),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getReportData } from "@/features/reports/services/report-service";

function mockQuery<T>(result: { data: T | null; error: null }) {
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown) => void) => resolve(result),
    catch: () => chain,
  };
  const methods = ["select", "is", "gte", "lte", "eq", "in", "order", "limit", "range", "neq", "not", "gt", "lt"];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  return chain as unknown as ReturnType<ReturnType<typeof createAdminClient>["from"]>;
}

const SCHEDULES_WITH_KECAMATAN = [
  {
    id: "1",
    visit_date: "2026-07-01",
    status: "completed",
    user_id: "u1",
    kabupaten_id: "kab1",
    kecamatan_id: "kec1",
    user: { name: "Alice" },
    kabupaten: { name: "Kab A" },
    kecamatan: { name: "Kec X" },
    visit_time: null,
  },
  {
    id: "2",
    visit_date: "2026-07-01",
    status: "pending",
    user_id: "u1",
    kabupaten_id: "kab1",
    kecamatan_id: "kec1",
    user: { name: "Alice" },
    kabupaten: { name: "Kab A" },
    kecamatan: { name: "Kec X" },
    visit_time: null,
  },
  {
    id: "3",
    visit_date: "2026-07-02",
    status: "completed",
    user_id: "u2",
    kabupaten_id: "kab1",
    kecamatan_id: "kec2",
    user: { name: "Bob" },
    kabupaten: { name: "Kab A" },
    kecamatan: { name: "Kec Y" },
    visit_time: null,
  },
];

describe("getReportData — by_kecamatan breakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { getAuthContext } = vi.mocked(require("@/lib/auth/authorization"));
    getAuthContext.mockResolvedValue({ userId: "admin", role: "admin" });

    const admin = createAdminClient();
    vi.mocked(admin.from).mockReturnValue(
      mockQuery({ data: SCHEDULES_WITH_KECAMATAN, error: null }),
    );
  });

  it("groups by kecamatan correctly", async () => {
    const result = await getReportData({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
    });

    expect(result.by_kecamatan).toHaveLength(2);

    const kecX = result.by_kecamatan.find((k) => k.kecamatan_name === "Kec X");
    expect(kecX).toBeDefined();
    expect(kecX!.total).toBe(2);
    expect(kecX!.completed).toBe(1);

    const kecY = result.by_kecamatan.find((k) => k.kecamatan_name === "Kec Y");
    expect(kecY).toBeDefined();
    expect(kecY!.total).toBe(1);
    expect(kecY!.completed).toBe(1);
  });

  it("excludes schedules without kecamatan_id", async () => {
    const admin = createAdminClient();
    vi.mocked(admin.from).mockReturnValue(
      mockQuery({
        data: [
          {
            id: "4",
            visit_date: "2026-07-03",
            status: "completed",
            user_id: "u1",
            kabupaten_id: "kab1",
            kecamatan_id: null,
            user: { name: "Alice" },
            kabupaten: { name: "Kab A" },
            kecamatan: null,
            visit_time: null,
          },
        ],
        error: null,
      }),
    );

    const result = await getReportData({
      date_from: "2026-07-01",
      date_to: "2026-07-31",
    });

    expect(result.by_kecamatan).toHaveLength(0);
  });
});
