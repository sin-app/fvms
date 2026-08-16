import { describe, it, expect } from "vitest";
import { applyAutoDerivation } from "@/features/excel-import/services/import-service";

interface MutableSchedule {
  real_tanam_ha?: number;
  gagal_tanam?: number;
  sisa_di_lahan_ha?: number;
  tgl_panen?: string;
  visit_date: string;
  status?: string;
  panen_keterangan?: string;
}

describe("applyAutoDerivation", () => {
  it("sets gagal_total when real_tanam_ha - gagal_tanam <= 0", () => {
    const schedules: MutableSchedule[] = [
      { real_tanam_ha: 2, gagal_tanam: 2, visit_date: "2026-08-01" },
      { real_tanam_ha: 3, gagal_tanam: 5, visit_date: "2026-08-02" },
    ];

    applyAutoDerivation(schedules);

    expect(schedules[0]!.status).toBe("gagal_total");
    expect(schedules[0]!.panen_keterangan).toBe("Bongkar Total");
    expect(schedules[1]!.status).toBe("gagal_total");
    expect(schedules[1]!.panen_keterangan).toBe("Bongkar Total");
  });

  it("does not force Bongkar Total when sisa_di_lahan_ha=0 but real/gagal mismatched", () => {
    const schedules: MutableSchedule[] = [
      { sisa_di_lahan_ha: 0, gagal_tanam: 1, visit_date: "2026-08-01" },
    ];

    applyAutoDerivation(schedules);

    expect(schedules[0]!.panen_keterangan).toBeUndefined();
    expect(schedules[0]!.status).toBe("pending");
  });

  it("sets completed when sisa_di_lahan_ha=0 and no gagal_tanam", () => {
    const schedules: MutableSchedule[] = [
      { sisa_di_lahan_ha: 0, visit_date: "2026-08-01" },
    ];

    applyAutoDerivation(schedules);

    expect(schedules[0]!.status).toBe("completed");
  });

  it("sets gagal_partial when real - gagal equals sisa", () => {
    const schedules: MutableSchedule[] = [
      { real_tanam_ha: 5, gagal_tanam: 2, sisa_di_lahan_ha: 3, visit_date: "2026-08-01" },
    ];

    applyAutoDerivation(schedules);

    expect(schedules[0]!.status).toBe("gagal_partial");
  });

  it("handles missing numeric fields gracefully", () => {
    const schedules: MutableSchedule[] = [
      { visit_date: "2026-08-01" },
      { real_tanam_ha: 5, visit_date: "2026-08-02" },
      { gagal_tanam: 3, visit_date: "2026-08-03" },
    ];

    applyAutoDerivation(schedules);

    for (const s of schedules) {
      expect(s.status).toBe("pending");
    }
  });
});