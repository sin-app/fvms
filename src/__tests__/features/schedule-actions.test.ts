import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  getAuthContext: vi.fn(),
  isPrivileged: vi.fn(() => true),
  canAccessSchedule: vi.fn(() => true),
  qcKabupatenScope: vi.fn(() => null),
}));

vi.mock("@/features/schedules/services/schedule-service", () => ({
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  getScheduleOwnerIds: vi.fn(() => []),
}));

import { createScheduleAction, updateScheduleAction } from "@/features/schedules/actions/schedule-actions";
import { createSchedule, updateSchedule } from "@/features/schedules/services/schedule-service";
import { getAuthContext } from "@/lib/auth/authorization";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { ActionResponse } from "@/types/common";

// updateScheduleAction kini membaca nilai DB yang ada sebelum derivasi status.
function mockExistingFetch(overrides: Record<string, unknown> = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      visit_time: null,
      notes: null,
      latitude: null,
      tgl_panen: null,
      real_panen: null,
      status: null,
      real_tanam_ha: null,
      gagal_tanam: null,
      sisa_di_lahan_ha: null,
      ...overrides,
    },
    error: null,
  });
  // chain: select() -> eq() -> is() -> maybeSingle()
  const isChain = { maybeSingle };
  const eqChain = { is: vi.fn().mockReturnValue(isChain) };
  const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(eqChain) });
  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: vi.fn().mockReturnValue({ select }),
  });
  return { maybeSingle };
}

const baseFormData = () => {
  const fd = new FormData();
  fd.set("user_id", "user-1");
  fd.set("kabupaten_id", "kab-1");
  fd.set("kecamatan_id", "kec-1");
  fd.set("desa_id", "desa-1");
  fd.set("visit_date", "2026-08-15");
  fd.set("ph_tanah", "");
  fd.set("real_tanam_ha", "");
  fd.set("gagal_tanam", "");
  fd.set("sisa_di_lahan_ha", "");
  return fd;
};

const emptyResponse: ActionResponse = { success: true };

describe("schedule-actions auto-derivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue({
      userId: "admin",
      role: "admin",
      assignedKabupatenIds: [],
    } as never);
    vi.mocked(createSchedule).mockResolvedValue("new-id");
    vi.mocked(updateSchedule).mockResolvedValue(undefined);
    mockExistingFetch();
  });

  describe("createScheduleAction", () => {
    it("sets status to gagal_total when real_tanam_ha - gagal_tanam <= 0", async () => {
      const fd = baseFormData();
      fd.set("real_tanam_ha", "2");
      fd.set("gagal_tanam", "2");

      await createScheduleAction(emptyResponse, fd);

      expect(createSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ status: "gagal_total", panen_keterangan: "Bongkar Total" }),
      );
    });

    it("sets status to gagal_total (Bongkar Total) when real - gagal <= 0, even with tgl_panen", async () => {
      const fd = baseFormData();
      fd.set("real_tanam_ha", "2");
      fd.set("gagal_tanam", "2");
      fd.set("tgl_panen", "2026-08-20");

      await createScheduleAction(emptyResponse, fd);

      expect(createSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ status: "gagal_total", panen_keterangan: "Bongkar Total" }),
      );
    });

    it("sets status to gagal_partial when 0 < sisa < real_tanam_ha", async () => {
      const fd = baseFormData();
      fd.set("real_tanam_ha", "5");
      fd.set("gagal_tanam", "1");
      fd.set("sisa_di_lahan_ha", "4");

      await createScheduleAction(emptyResponse, fd);

      const callArgs = vi.mocked(createSchedule).mock.calls[0][0];
      expect(callArgs.status).toBe("gagal_partial");
    });

    it("falls back to pending when real_tanam_ha/gagal_tanam are missing", async () => {
      const fd = baseFormData();

      await createScheduleAction(emptyResponse, fd);

      const callArgs = vi.mocked(createSchedule).mock.calls[0][0];
      expect(callArgs.status).toBe("pending");
    });
  });

  describe("updateScheduleAction", () => {
    it("sets status to gagal_total via update when real_tanam_ha - gagal_tanam <= 0", async () => {
      const fd = baseFormData();
      fd.set("id", "sched-1");
      fd.set("real_tanam_ha", "3");
      fd.set("gagal_tanam", "3");

      await updateScheduleAction(emptyResponse, fd);

      expect(updateSchedule).toHaveBeenCalledWith(
        "sched-1",
        expect.objectContaining({ status: "gagal_total", panen_keterangan: "Bongkar Total" }),
      );
    });

    it("sets status to gagal_total via update when real_tanam_ha - gagal_tanam <= 0", async () => {
      const fd = baseFormData();
      fd.set("id", "sched-1");
      fd.set("real_tanam_ha", "3");
      fd.set("gagal_tanam", "3");

      await updateScheduleAction(emptyResponse, fd);

      expect(updateSchedule).toHaveBeenCalledWith(
        "sched-1",
        expect.objectContaining({ status: "gagal_total", panen_keterangan: "Bongkar Total" }),
      );
    });

    it("does not lower an explicit terminal status to pending when fields empty", async () => {
      const fd = baseFormData();
      fd.set("id", "sched-1");
      mockExistingFetch({ status: "gagal_total", real_tanam_ha: 3, gagal_tanam: 3 });

      await updateScheduleAction(emptyResponse, fd);

      const [, data] = vi.mocked(updateSchedule).mock.calls[0];
      expect(data.status).toBe("gagal_total");
    });

    it("falls back to pending when real_tanam_ha/gagal_tanam are missing", async () => {
      const fd = baseFormData();
      fd.set("id", "sched-1");

      await updateScheduleAction(emptyResponse, fd);

      const [, data] = vi.mocked(updateSchedule).mock.calls[0];
      expect(data.status).toBe("pending");
    });
  });
});
