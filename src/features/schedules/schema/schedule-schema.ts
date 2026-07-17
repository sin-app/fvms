import { z } from "zod";

export const scheduleSchema = z.object({
  user_id: z.string().min(1, "Petugas wajib dipilih"),
  kabupaten_id: z.string().min(1, "Kabupaten wajib dipilih"),
  kecamatan_id: z.string().min(1, "Kecamatan wajib dipilih"),
  desa_id: z.string().min(1, "Desa wajib dipilih"),
  visit_date: z.string().min(1, "Tanggal kunjungan wajib diisi"),
  notes: z.string().optional(),
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export const scheduleBulkSchema = z.array(scheduleSchema);

export const scheduleFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  kabupaten_id: z.string().optional(),
  kecamatan_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
});

export type ScheduleFilterInput = z.infer<typeof scheduleFilterSchema>;
