import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { createSchedule, deleteSchedule } from "@/features/schedules/services/schedule-service";

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
});
