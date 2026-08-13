import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  getConfig: () => ({
    supabaseUrl: "http://localhost",
    supabaseAnonKey: "anon",
    supabaseServiceRoleKey: "service",
  }),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  uploadLandProposalPhoto,
  deleteLandProposalPhoto,
} from "@/features/land-proposals/services/land-proposal-service";
import type { AuthContext } from "@/lib/auth/authorization";
import type { LandProposal } from "@/types";

const PROD_CTX: AuthContext = { userId: "prod-1", role: "produksi", assignedKabupatenIds: [] };
const ADMIN_CTX: AuthContext = { userId: "adm-1", role: "admin", assignedKabupatenIds: [] };

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

function buildChain(response: unknown) {
  const methods = ["select", "eq", "is", "maybeSingle", "delete"] as const;
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown) => void) => resolve(response),
    catch: () => {},
  };
  for (const m of methods) chain[m] = vi.fn(() => chain);
  return chain as unknown as ReturnType<ReturnType<typeof createAdminClient>["from"]>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed/url" } }),
      })),
    },
    from: vi.fn(() => buildChain({ data: PROPOSAL, error: null })),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function createMockFile(name = "test.png", type = "image/png"): File {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );
  return new File([png], name, { type });
}

describe("uploadLandProposalPhoto", () => {
  it("uploads file and inserts photo record", async () => {
    const mockFile = createMockFile();

    let fetchCallCount = 0;
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ Key: "proposals/prop-1/photo.webp" })),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([{ url: "proposals/prop-1/photo.webp", file_size: 256, mime_type: "image/webp" }])),
      });
    });

    const result = await uploadLandProposalPhoto("prop-1", mockFile, PROD_CTX);
    expect(result.url).toContain("photo.webp");
    expect(result.mime_type).toBe("image/webp");
    expect(result.file_size).toBeGreaterThan(0);
  });

  it("blocks non-owner upload when proposal not pending", async () => {
    const approved = { ...PROPOSAL, status: "approved" };
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      storage: { from: vi.fn() },
      from: vi.fn(() => buildChain({ data: approved, error: null })),
    });

    const mockFile = createMockFile();
    await expect(uploadLandProposalPhoto("prop-1", mockFile, PROD_CTX)).rejects.toThrow(
      "Hanya pengaju (saat pending) atau admin",
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("allows admin upload", async () => {
    const mockFile = createMockFile();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([{ url: "proposals/prop-1/photo.webp", file_size: 1, mime_type: "image/webp" }])),
    });

    const result = await uploadLandProposalPhoto("prop-1", mockFile, ADMIN_CTX);
    expect(result.mime_type).toBe("image/webp");
  });
});

describe("deleteLandProposalPhoto", () => {
  it("deletes photo row and storage object", async () => {
    const proposalChain = buildChain({ data: PROPOSAL, error: null });
    const photoChain = buildChain({ data: { id: "photo-1", url: "proposals/prop-1/photo.webp" }, error: null });

    const fromMock = vi.fn()
      .mockReturnValueOnce(proposalChain)
      .mockReturnValueOnce(photoChain)
      .mockReturnValue(photoChain);

    const removeMock = vi.fn().mockResolvedValue({ error: null });
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          remove: removeMock,
          createSignedUrl: vi.fn(),
        })),
      },
      from: fromMock,
    });

    await expect(deleteLandProposalPhoto("photo-1", "prop-1", PROD_CTX)).resolves.toBeUndefined();
    expect(photoChain.delete).toHaveBeenCalled();
    expect(removeMock).toHaveBeenCalled();
  });

  it("rejects delete when photo not found", async () => {
    const fromMock = vi.fn()
      .mockReturnValueOnce(buildChain({ data: PROPOSAL, error: null }))
      .mockReturnValueOnce(buildChain({ data: null, error: null }));

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      storage: { from: vi.fn() },
      from: fromMock,
    });

    await expect(deleteLandProposalPhoto("photo-x", "prop-1", PROD_CTX)).rejects.toThrow(
      "Foto tidak ditemukan",
    );
  });
});