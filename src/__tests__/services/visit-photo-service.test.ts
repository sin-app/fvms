import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { uploadVisitPhoto, deleteVisitPhoto } from "@/features/visits/services/visit-service";

describe("visit-photo-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockFile(name = "test.jpg", type = "image/jpeg", size = 1024): File {
    const blob = new Blob(["x".repeat(size)], { type });
    return new File([blob], name, { type });
  }

  describe("uploadVisitPhoto", () => {
    it("uploads file and inserts photo record", async () => {
      const mockFile = createMockFile();

      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/photo.jpg" } });
      const mockSingle = vi.fn().mockResolvedValue({
        data: { url: "https://example.com/photo.jpg", file_size: 1024, mime_type: "image/jpeg" },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === "visit_photos") return { insert: mockInsert };
          return {};
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl,
          }),
        },
      });

      const result = await uploadVisitPhoto("sched-1", mockFile);
      expect(mockUpload).toHaveBeenCalled();
      expect(result.url).toBe("https://example.com/photo.jpg");
    });

    it("throws on upload error", async () => {
      const mockFile = createMockFile();
      const mockUpload = vi.fn().mockResolvedValue({ error: new Error("Upload failed") });

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({}),
        storage: {
          from: vi.fn().mockReturnValue({ upload: mockUpload, getPublicUrl: vi.fn() }),
        },
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
