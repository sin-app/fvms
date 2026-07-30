import { describe, it, expect } from "vitest";
import { calcRencanaPanen, getPanenStatus, deriveScheduleStatus } from "@/features/panen/services/panen-logic";

describe("calcRencanaPanen", () => {
  it("returns null when tgl_tanam is missing", () => {
    expect(calcRencanaPanen(null, "JMP-01")).toBeNull();
    expect(calcRencanaPanen(undefined, "JMP-01")).toBeNull();
    expect(calcRencanaPanen("", "JMP-01")).toBeNull();
  });

  it("returns null when cgr doesn't match known varieties", () => {
    expect(calcRencanaPanen("2026-01-01", "UNKNOWN")).toBeNull();
    expect(calcRencanaPanen("2026-01-01", null)).toBeNull();
  });

  it("calculates rencana panen 90 days after tgl_tanam for JMP-01", () => {
    expect(calcRencanaPanen("2026-01-01", "JMP-01")).toBe("2026-04-01");
  });

  it("calculates rencana panen for JMP-05 (85 days)", () => {
    expect(calcRencanaPanen("2026-01-01", "JMP-05")).toBe("2026-03-27");
  });

  it("is case-insensitive for CGR codes", () => {
    expect(calcRencanaPanen("2026-01-01", "jmp-01")).toBe("2026-04-01");
    expect(calcRencanaPanen("2026-01-01", "Jmp-05")).toBe("2026-03-27");
  });
});

describe("getPanenStatus", () => {
  it("returns Panen when tgl_panen is set", () => {
    const result = getPanenStatus({ tgl_panen: "2026-08-01" });
    expect(result.label).toBe("Panen");
    expect(result.harvested).toBe(true);
  });

  it("returns Panen when real_panen is set", () => {
    const result = getPanenStatus({ real_panen: "2026-08-01" });
    expect(result.label).toBe("Panen");
    expect(result.harvested).toBe(true);
  });

  it("returns Jatuh Tempo when past rencana_panen", () => {
    const result = getPanenStatus({ rencana_panen: "2020-01-01" });
    expect(result.label).toBe("Jatuh Tempo");
    expect(result.harvested).toBe(false);
  });

  it("returns dash when no info available", () => {
    const result = getPanenStatus({});
    expect(result.label).toBe("—");
    expect(result.harvested).toBe(false);
  });
});

describe("deriveScheduleStatus", () => {
  // ── sisa_di_lahan_ha = 0 ──
  it("returns completed when sisa=0 and gagal is null", () => {
    expect(deriveScheduleStatus({ sisa_di_lahan_ha: 0 })).toEqual({ status: "completed" });
  });

  it("returns completed when sisa=0 and gagal=0", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 0, sisa_di_lahan_ha: 0 })).toEqual({ status: "completed" });
  });

  it("returns gagal_total when sisa=0 and real-gagal=0 (formula holds)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 10, sisa_di_lahan_ha: 0 })).toEqual({ status: "gagal_total", panen_keterangan: "Bongkar Total" });
  });

  // ── sisa_di_lahan_ha > 0 with formula ──
  it("returns gagal_partial when formula holds and sisa>0", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 3, sisa_di_lahan_ha: 7 })).toEqual({ status: "gagal_partial" });
  });

  it("returns null when sisa>0 but formula fails (real-gagal != sisa)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 2, sisa_di_lahan_ha: 7 })).toBeNull();
  });

  it("returns null when sisa>0 and gagal=0 (no failure)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 0, sisa_di_lahan_ha: 10 })).toBeNull();
  });

  // ── sisa_di_lahan_ha = null ──
  it("returns null when sisa is null and no data", () => {
    expect(deriveScheduleStatus({})).toBeNull();
  });

  it("returns null when sisa is null and real_tanam_ha missing", () => {
    expect(deriveScheduleStatus({ gagal_tanam: 1 })).toBeNull();
  });

  it("returns null when sisa is null and gagal_tanam missing", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10 })).toBeNull();
  });

  it("returns gagal_total when sisa is null and real <= gagal", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 10 })).toEqual({ status: "gagal_total", panen_keterangan: "Bongkar Total" });
  });

  it("returns gagal_total when gagal exceeds real_tanam (null sisa)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 5, gagal_tanam: 8 })).toEqual({ status: "gagal_total", panen_keterangan: "Bongkar Total" });
  });

  it("returns null when sisa is null and gagal_tanam is 0", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 0 })).toBeNull();
  });

  it("returns null when sisa is null and partial failure (sisa > 0)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 3 })).toBeNull();
  });

  // ── hasActivity fallback (pending / in_progress) ──
  it("returns pending when hasActivity=false and formula doesn't match", () => {
    expect(deriveScheduleStatus({ hasActivity: false })).toEqual({ status: "pending" });
  });

  it("returns in_progress when hasActivity=true and formula doesn't match", () => {
    expect(deriveScheduleStatus({ hasActivity: true })).toEqual({ status: "in_progress" });
  });

  it("returns pending when sisa>0, gagal=0, hasActivity=false", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 0, sisa_di_lahan_ha: 10, hasActivity: false })).toEqual({ status: "pending" });
  });

  it("returns in_progress when sisa>0, gagal=0, hasActivity=true", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 0, sisa_di_lahan_ha: 10, hasActivity: true })).toEqual({ status: "in_progress" });
  });

  it("returns gagal_partial even when hasActivity=false (formula takes priority)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 3, sisa_di_lahan_ha: 7, hasActivity: false })).toEqual({ status: "gagal_partial" });
  });

  it("returns completed even when hasActivity=false (formula takes priority)", () => {
    expect(deriveScheduleStatus({ sisa_di_lahan_ha: 0, hasActivity: false })).toEqual({ status: "completed" });
  });

  it("returns gagal_total even when hasActivity=false (formula takes priority)", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 10, sisa_di_lahan_ha: 0, hasActivity: false })).toEqual({ status: "gagal_total", panen_keterangan: "Bongkar Total" });
  });
});
