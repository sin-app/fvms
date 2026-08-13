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

vi.mock("@/features/schedules/services/schedule-service", () => ({
  createSchedule: vi.fn(),
}));

vi.mock("@/features/notifications/services/notification-service", () => ({
  createNotification: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { createSchedule } from "@/features/schedules/services/schedule-service";
import { createNotification } from "@/features/notifications/services/notification-service";
import {
  listLandProposals,
  createLandProposal,
  updateLandProposal,
  cancelLandProposal,
  approveLandProposal,
  rejectLandProposal,
  assignPetugas,
  notifyProposalSubmitted,
} from "@/features/land-proposals/services/land-proposal-service";
import type { AuthContext } from "@/lib/auth/authorization";
import type { LandProposal } from "@/types";

let chainFns: Record<string, ReturnType<typeof vi.fn>> | null = null;

function buildChain(response: unknown) {
  const methods = [
    "select",
    "eq",
    "in",
    "is",
    "order",
    "update",
    "insert",
    "delete",
    "maybeSingle",
    "single",
    "contains",
    "limit",
  ] as const;
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown) => void) => resolve(response),
    catch: () => {},
  };
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chainFns = chain as Record<string, ReturnType<typeof vi.fn>>;
  return chain as unknown as ReturnType<ReturnType<typeof createAdminClient>["from"]>;
}

const PROPOSAL: LandProposal = {
  id: "prop-1",
  proposed_by: "prod-1",
  reviewed_by: null,
  kabupaten_id: "kab-a",
  kecamatan_id: "kec-a",
  desa_id: "desa-a",
  block_no: "B1",
  no_plot: "P1",
  document_no: null,
  member_name: "Member A",
  cgr: null,
  cgr_code: null,
  nis: null,
  ph_tanah: null,
  real_tanam_ha: null,
  detaseling: null,
  tgl_tanam: null,
  rencana_panen: null,
  notes: null,
  latitude: null,
  longitude: null,
  accuracy: null,
  status: "pending",
  review_note: null,
  created_schedule_id: null,
  created_at: "2026-08-12T08:00:00Z",
  updated_at: "2026-08-12T08:00:00Z",
  deleted_at: null,
  kabupaten: { id: "kab-a", name: "Kab A", code: "KA", is_active: true, created_at: "", updated_at: "", deleted_at: null },
};

const QC_CTX: AuthContext = { userId: "qc-1", role: "qc", assignedKabupatenIds: ["kab-a"] };
const ADMIN_CTX: AuthContext = { userId: "adm-1", role: "admin", assignedKabupatenIds: [] };
const PROD_CTX: AuthContext = { userId: "prod-1", role: "produksi", assignedKabupatenIds: [] };

function mockFrom(responses: unknown[]) {
  const queue = [...responses];
  const removeMock = vi.fn().mockResolvedValue({ error: null });
  const signMock = vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed/url" } });
  const storageMock = {
    from: vi.fn(() => ({
      createSignedUrl: signMock,
      remove: removeMock,
    })),
  };
  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    storage: storageMock,
    from: vi.fn(() => buildChain(queue.length > 1 ? queue.shift() : queue[0])),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (createSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "sched-1" });
});

describe("listLandProposals", () => {
  it("scopes produksi to own proposals", async () => {
    mockFrom([{ data: [], error: null }]);
    await listLandProposals(PROD_CTX);
    expect(chainFns?.eq).toHaveBeenCalledWith("proposed_by", "prod-1");
  });

  it("scopes QC to assigned kabupaten", async () => {
    mockFrom([{ data: [], error: null }]);
    await listLandProposals(QC_CTX);
    expect(chainFns?.in).toHaveBeenCalledWith("kabupaten_id", ["kab-a"]);
  });
});

describe("createLandProposal", () => {
  it("inserts with proposed_by = current user and status pending", async () => {
    mockFrom([{ data: PROPOSAL, error: null }]);
    const result = await createLandProposal(
      { kabupaten_id: "kab-a", kecamatan_id: "kec-a", desa_id: "desa-a", block_no: "B1" },
      PROD_CTX,
    );
    expect(result.status).toBe("pending");
    expect(result.proposed_by).toBe("prod-1");
  });
});

describe("cancelLandProposal", () => {
  it("allows owner to cancel pending proposal", async () => {
    mockFrom([{ data: PROPOSAL, error: null }, { data: null, error: null }]);
    await expect(cancelLandProposal("prop-1", PROD_CTX)).resolves.toBeUndefined();
  });

  it("rejects cancellation by non-owner", async () => {
    mockFrom([{ data: PROPOSAL, error: null }]);
    const other: AuthContext = { userId: "prod-2", role: "produksi", assignedKabupatenIds: [] };
    await expect(cancelLandProposal("prop-1", other)).rejects.toThrow("Tidak memiliki akses");
  });

  it("rejects cancellation of non-pending proposal", async () => {
    mockFrom([{ data: { ...PROPOSAL, status: "approved" }, error: null }]);
    await expect(cancelLandProposal("prop-1", PROD_CTX)).rejects.toThrow("pending");
  });
});

describe("updateLandProposal", () => {
  it("rejects edit by non-owner", async () => {
    mockFrom([{ data: PROPOSAL, error: null }, { data: null, error: null }]);
    const other: AuthContext = { userId: "prod-2", role: "produksi", assignedKabupatenIds: [] };
    await expect(
      updateLandProposal("prop-1", { kabupaten_id: "kab-a", kecamatan_id: "kec-a", desa_id: "desa-a" }, other),
    ).rejects.toThrow("Tidak memiliki akses");
  });

  it("rejects edit when proposal is not pending", async () => {
    mockFrom([{ data: { ...PROPOSAL, status: "rejected" }, error: null }]);
    await expect(
      updateLandProposal("prop-1", { kabupaten_id: "kab-a", kecamatan_id: "kec-a", desa_id: "desa-a" }, PROD_CTX),
    ).rejects.toThrow("pending");
  });

  it("allows admin to edit pending proposal from produksi", async () => {
    const updated = { ...PROPOSAL, block_no: "B-EDITED" };
    mockFrom([{ data: PROPOSAL, error: null }, { data: updated, error: null }]);
    const result = await updateLandProposal(
      "prop-1",
      { kabupaten_id: "kab-a", kecamatan_id: "kec-a", desa_id: "desa-a", block_no: "B-EDITED" },
      ADMIN_CTX,
    );
    expect(result.block_no).toBe("B-EDITED");
  });

  it("resets rejected proposal to pending when admin edits", async () => {
    const rejected = { ...PROPOSAL, status: "rejected" as const, review_note: "data salah" };
    const updated = { ...PROPOSAL, status: "pending", review_note: null, reviewed_by: null };
    mockFrom([{ data: rejected, error: null }, { data: updated, error: null }]);

    const result = await updateLandProposal(
      "prop-1",
      { kabupaten_id: "kab-a", kecamatan_id: "kec-a", desa_id: "desa-a" },
      ADMIN_CTX,
    );

    expect(result.status).toBe("pending");
    expect(result.review_note).toBeNull();
  });

  it("blocks admin editing approved proposal", async () => {
    mockFrom([{ data: { ...PROPOSAL, status: "approved" }, error: null }]);
    await expect(
      updateLandProposal("prop-1", { kabupaten_id: "kab-a", kecamatan_id: "kec-a", desa_id: "desa-a" }, ADMIN_CTX),
    ).rejects.toThrow("pending atau ditolak");
  });
});

describe("approveLandProposal", () => {
  it("creates schedule (owner = approver) and marks proposal approved", async () => {
    const updated = { ...PROPOSAL, status: "approved", reviewed_by: "qc-1", created_schedule_id: "sched-1" };
    mockFrom([{ data: PROPOSAL, error: null }, { data: updated, error: null }]);

    const result = await approveLandProposal("prop-1", QC_CTX);

    expect(result.status).toBe("approved");
    expect(result.created_schedule_id).toBe("sched-1");
    expect(createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "qc-1", visit_date: expect.any(String), status: "pending" }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "prod-1", title: "Pengajuan disetujui" }),
    );
  });

  it("blocks QC outside assigned kabupaten", async () => {
    const outside: AuthContext = { userId: "qc-2", role: "qc", assignedKabupatenIds: ["kab-b"] };
    mockFrom([{ data: PROPOSAL, error: null }]);
    await expect(approveLandProposal("prop-1", outside)).rejects.toThrow("Tidak memiliki akses");
    expect(createSchedule).not.toHaveBeenCalled();
  });

  it("blocks approval of non-pending proposal", async () => {
    mockFrom([{ data: { ...PROPOSAL, status: "approved" }, error: null }]);
    await expect(approveLandProposal("prop-1", ADMIN_CTX)).rejects.toThrow("pending");
    expect(createSchedule).not.toHaveBeenCalled();
  });
});

describe("rejectLandProposal", () => {
  it("rejects with review note and notifies proposer", async () => {
    const updated = { ...PROPOSAL, status: "rejected", reviewed_by: "adm-1", review_note: "Lahan tidak sesuai" };
    mockFrom([{ data: PROPOSAL, error: null }, { data: updated, error: null }]);

    const result = await rejectLandProposal("prop-1", "Lahan tidak sesuai", ADMIN_CTX);

    expect(result.status).toBe("rejected");
    expect(result.review_note).toBe("Lahan tidak sesuai");
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "prod-1", title: "Pengajuan ditolak" }),
    );
  });
});

describe("assignPetugas", () => {
  it("assigns schedule to a produksi user", async () => {
    const approved = { ...PROPOSAL, status: "approved", created_schedule_id: "sched-1" };
    mockFrom([
      { data: approved, error: null },
      { data: { id: "prod-2", role: "produksi" }, error: null },
      { data: null, error: null },
    ]);

    await expect(assignPetugas("prop-1", "prod-2", QC_CTX)).resolves.toBeUndefined();
  });

  it("rejects when target user is not produksi", async () => {
    const approved = { ...PROPOSAL, status: "approved", created_schedule_id: "sched-1" };
    mockFrom([
      { data: approved, error: null },
      { data: { id: "adm-x", role: "admin" }, error: null },
    ]);

    await expect(assignPetugas("prop-1", "adm-x", QC_CTX)).rejects.toThrow("produksi");
  });

  it("requires approved proposal with created schedule", async () => {
    mockFrom([{ data: PROPOSAL, error: null }]);
    await expect(assignPetugas("prop-1", "prod-2", QC_CTX)).rejects.toThrow("disetujui terlebih dahulu");
  });
});

describe("notifyProposalSubmitted", () => {
  it("notifies QCs in kabupaten and admins", async () => {
    mockFrom([
      { data: [{ id: "qc-1" }, { id: "qc-2" }], error: null },
      { data: [{ id: "adm-1" }], error: null },
    ]);

    await notifyProposalSubmitted("kab-a", "Kab A");

    expect(createNotification).toHaveBeenCalledTimes(3);
  });
});