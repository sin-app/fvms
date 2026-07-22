import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  qcKabupatenScope: vi.fn(
    (ctx: { role: string; assignedKabupatenIds: string[] }) =>
      ctx.role === "qc" ? ctx.assignedKabupatenIds : null,
  ),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getDashboardData } from "@/features/dashboard/services/dashboard-service";
import type { AuthContext } from "@/lib/auth/authorization";

const captured: Array<{ method: string; args: unknown[] }> = [];

function buildQuery(response: unknown) {
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown) => void) => resolve(response),
    catch: () => {},
  };
  const methods = ["select", "is", "gte", "lte", "eq", "lt", "gt", "not", "order", "limit", "in"];
  for (const m of methods) {
    chain[m] = vi.fn((...args: unknown[]) => {
      captured.push({ method: m, args });
      return chain;
    });
  }
  Object.setPrototypeOf(chain, {
    then: (resolve: (v: unknown) => void) => resolve(response),
  });
  return chain as unknown as ReturnType<ReturnType<typeof createAdminClient>["from"]>;
}

const QC_CTX: AuthContext = {
  userId: "qc-1",
  role: "qc",
  assignedKabupatenIds: ["kab-a"],
};

describe("dashboard-service scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.length = 0;
  });

  it("restricts QC dashboard to assigned kabupaten", async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: [], error: null, count: 5 })),
    });

    await getDashboardData("all", QC_CTX);

    const usedIn = captured.some(
      (c) => c.method === "in" && c.args[0] === "kabupaten_id",
    );
    expect(usedIn).toBe(true);
  });

  it("scopes produksi dashboard by user_id", async () => {
    const prodCtx: AuthContext = { userId: "prod-1", role: "produksi", assignedKabupatenIds: [] };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: [], error: null, count: 2 })),
    });

    await getDashboardData("prod-1", prodCtx);

    const usedEq = captured.some(
      (c) => c.method === "eq" && c.args[0] === "user_id" && c.args[1] === "prod-1",
    );
    expect(usedEq).toBe(true);
  });
});
