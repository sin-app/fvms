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
import { uploadVisitPhoto, deleteVisitPhoto } from "@/features/visits/services/visit-service";

describe("visit-photo-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createMockFile(name = "test.png", type = "image/png"): File {
    // 1x1 PNG valid (sharp akan re-encode ke WebP di server).
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    );
    return new File([png], name, { type });
  }

  describe("uploadVisitPhoto", () => {
    it("uploads file and inserts photo record", async () => {
      const mockFile = createMockFile();

      let fetchCallCount = 0;
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount === 1) {
          // Storage upload response
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ Key: "visits/sched-1/photo.webp" })),
          });
        }
        // DB insert response
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify([{ url: "visits/sched-1/photo.webp", file_size: 256, mime_type: "image/webp" }])),
        });
      });

      const result = await uploadVisitPhoto("sched-1", mockFile);
      expect(result.url).toContain("photo.webp");
      expect(result.mime_type).toBe("image/webp");
      expect(result.file_size).toBeGreaterThan(0);
    });

    it("throws on upload error", async () => {
      const mockFile = createMockFile();

      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Upload failed"),
      });

      await expect(uploadVisitPhoto("sched-1", mockFile)).rejects.toThrow("Upload failed");
    });
  });

  describe("deleteVisitPhoto", () => {
    it("removes photo record and storage file", async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      const mockSingle = vi.fn().mockResolvedValue({
        data: { url: "https://example.com/storage/visits/sched-1/photo-123.jpg" },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });
      const mockEq = vi.fn().mockReturnThis();

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "visit_photos") {
            return {
              select: mockSelect,
              delete: mockDelete,
              eq: mockEq,
            };
          }
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({ remove: mockRemove }),
        },
      });

      await deleteVisitPhoto("photo-1");
      expect(mockSelect).toHaveBeenCalled();
    });
  });
});
