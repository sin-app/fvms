import { z } from "zod";

export const columnMappingSchema = z.record(z.string(), z.string());

export type ColumnMappingInput = z.infer<typeof columnMappingSchema>;

export const importRowSchema = z.object({
  user_name: z.string().min(1, "Nama petugas wajib diisi"),
  kabupaten_name: z.string().min(1, "Kabupaten wajib diisi"),
  kecamatan_name: z.string().min(1, "Kecamatan wajib diisi"),
  desa_name: z.string().min(1, "Desa wajib diisi"),
  visit_date: z.string().min(1, "Tanggal kunjungan wajib diisi"),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;
