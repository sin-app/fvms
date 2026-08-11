import { z } from "zod";

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  role: z.enum(["admin", "qc", "produksi"]),
  data: z.object({
    schedules: z.array(z.record(z.string(), z.unknown())).optional(),
    visitNotes: z.array(z.record(z.string(), z.unknown())).optional(),
    visitPhotos: z.array(z.record(z.string(), z.unknown())).optional(),
    regions: z
      .object({
        kabupaten: z.array(z.record(z.string(), z.unknown())).optional(),
        kecamatan: z.array(z.record(z.string(), z.unknown())).optional(),
        desa: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .optional(),
    users: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
});

export type BackupPayload = z.infer<typeof backupSchema>;

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
