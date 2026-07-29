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
  it("returns null when real_tanam_ha is missing", () => {
    expect(deriveScheduleStatus({ gagal_tanam: 1 })).toBeNull();
  });

  it("returns null when gagal_tanam is missing", () => {
    expect(deriveScheduleStatus({ real_tanam_ha: 10 })).toBeNull();
  });

  it("returns gagal_total when sisa <= 0 and no panen", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 10 });
    expect(result).toEqual({ status: "gagal_total", panen_keterangan: "Bongkar Total" });
  });

  it("returns gagal_total when gagal exceeds real_tanam and no panen", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 5, gagal_tanam: 8 });
    expect(result).toEqual({ status: "gagal_total", panen_keterangan: "Bongkar Total" });
  });

  it("returns pending when gagal_tanam is 0 and no panen", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 0 });
    expect(result).toEqual({ status: "pending" });
  });

  it("returns gagal_partial when 0 < sisa < real_tanam and no panen", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 3 });
    expect(result).toEqual({ status: "gagal_partial" });
  });

  it("returns completed when sisa <= 0 and tgl_panen is set", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 10, tgl_panen: "2026-07-01" });
    expect(result).toEqual({ status: "completed" });
  });

  it("returns completed when sisa <= 0 and real_panen is set", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 10, real_panen: "2026-07-01" });
    expect(result).toEqual({ status: "completed" });
  });

  it("handles partial failure with real_panen set", () => {
    const result = deriveScheduleStatus({ real_tanam_ha: 10, gagal_tanam: 3, real_panen: "2026-07-01" });
    expect(result).toBeNull();
  });
});
