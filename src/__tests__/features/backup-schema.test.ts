import { describe, it, expect } from "vitest";
import { backupSchema } from "@/features/settings/schema/backup-schema";

describe("backupSchema", () => {
  it("menerima payload v1 lengkap", () => {
    const result = backupSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-11T00:00:00Z",
      role: "admin",
      data: {
        schedules: [{ id: "s-1", status: "pending" }],
        visitNotes: [{ schedule_id: "s-1" }],
        visitPhotos: [{ id: "p-1" }],
        regions: {
          kabupaten: [{ id: "k-1", name: "Kab X" }],
          kecamatan: [],
          desa: [{ id: "d-1" }],
        },
        users: [{ id: "u-1" }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("menolak versi selain 1", () => {
    const result = backupSchema.safeParse({
      version: 2,
      exportedAt: "2026-08-11T00:00:00Z",
      role: "admin",
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it("menolak role yang tidak dikenal", () => {
    const result = backupSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-11T00:00:00Z",
      role: "superadmin",
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it("menerima payload kosong (backup produksi tanpa data)", () => {
    const result = backupSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-11T00:00:00Z",
      role: "produksi",
      data: {},
    });
    expect(result.success).toBe(true);
  });
});
