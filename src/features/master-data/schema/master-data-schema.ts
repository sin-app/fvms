import { z } from "zod";

export const kabupatenSchema = z.object({
  name: z.string().min(1, "Nama kabupaten wajib diisi").max(255),
  code: z.string().min(1, "Kode kabupaten wajib diisi").max(10),
  is_active: z.boolean().default(true),
});

export type KabupatenInput = z.infer<typeof kabupatenSchema>;

export const kecamatanSchema = z.object({
  kabupaten_id: z.string().min(1, "Kabupaten wajib dipilih"),
  name: z.string().min(1, "Nama kecamatan wajib diisi").max(255),
  code: z.string().min(1, "Kode kecamatan wajib diisi").max(10),
  is_active: z.boolean().default(true),
});

export type KecamatanInput = z.infer<typeof kecamatanSchema>;

export const desaSchema = z.object({
  kecamatan_id: z.string().min(1, "Kecamatan wajib dipilih"),
  name: z.string().min(1, "Nama desa wajib diisi").max(255),
  code: z.string().min(1, "Kode desa wajib diisi").max(10),
  is_active: z.boolean().default(true),
});

export type DesaInput = z.infer<typeof desaSchema>;
