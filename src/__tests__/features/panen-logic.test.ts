import { describe, it, expect } from "vitest";
import { calcRencanaPanen, getPanenStatus } from "@/features/panen/services/panen-logic";

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
