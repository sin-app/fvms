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
import type { ActionResponse } from "@/types/common";

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

    it("sets status to completed when tgl_panen is set and sisa <= 0", async () => {
      const fd = baseFormData();
      fd.set("real_tanam_ha", "2");
      fd.set("gagal_tanam", "2");
      fd.set("tgl_panen", "2026-08-20");

      await createScheduleAction(emptyResponse, fd);

      expect(createSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" }),
      );
    });

    it("sets status to gagal_partial when 0 < sisa < real_tanam_ha", async () => {
      const fd = baseFormData();
      fd.set("real_tanam_ha", "5");
      fd.set("gagal_tanam", "1");

      await createScheduleAction(emptyResponse, fd);

      const callArgs = vi.mocked(createSchedule).mock.calls[0][0];
      expect(callArgs.status).toBe("gagal_partial");
    });

    it("does not override status when real_tanam_ha/gagal_tanam are missing", async () => {
      const fd = baseFormData();

      await createScheduleAction(emptyResponse, fd);

      const callArgs = vi.mocked(createSchedule).mock.calls[0][0];
      expect(callArgs.status).toBeUndefined();
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

    it("sets status to completed via update when tgl_panen is set and sisa <= 0", async () => {
      const fd = baseFormData();
      fd.set("id", "sched-1");
      fd.set("real_tanam_ha", "2");
      fd.set("gagal_tanam", "2");
      fd.set("tgl_panen", "2026-08-20");

      await updateScheduleAction(emptyResponse, fd);

      expect(updateSchedule).toHaveBeenCalledWith(
        "sched-1",
        expect.objectContaining({ status: "completed" }),
      );
    });

    it("does not override status when real_tanam_ha/gagal_tanam are missing", async () => {
      const fd = baseFormData();
      fd.set("id", "sched-1");

      await updateScheduleAction(emptyResponse, fd);

      const [, data] = vi.mocked(updateSchedule).mock.calls[0];
      expect(data.status).toBeUndefined();
    });
  });
});
