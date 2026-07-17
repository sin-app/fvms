import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin-client";
import { saveVisitNotes } from "@/features/visits/services/visit-service";

describe("visit-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveVisitNotes", () => {
    it("inserts new notes when none exist", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null });
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockUpdate = vi.fn();

      const mockChain = {
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle,
        insert: mockInsert,
        update: mockUpdate,
      };

      Object.setPrototypeOf(mockChain, {
        get(prop: string) {
          return (mockChain as Record<string, unknown>)[prop] ?? vi.fn().mockReturnValue(mockChain);
        },
      });

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue(mockChain),
      });

      await saveVisitNotes({
        schedule_id: "sched-1",
        observation: "Good observation",
      });

      expect(mockInsert).toHaveBeenCalled();
    });

    it("updates existing notes when they exist", async () => {
      const mockEq = vi.fn().mockReturnValue(Promise.resolve({ error: null }));
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "notes-1" } });
      const mockSelect = vi.fn().mockReturnThis();

      const chain = {
        select: mockSelect,
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
        insert: vi.fn(),
        update: mockUpdate,
      };

      (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue(chain),
      });

      await saveVisitNotes({
        schedule_id: "sched-1",
        problem: "Found issue",
      });

      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
