import { z } from "zod";

export const scheduleSchema = z.object({
  user_id: z.string().min(1, "Produksi wajib dipilih"),
  kabupaten_id: z.string().min(1, "Kabupaten wajib dipilih"),
  kecamatan_id: z.string().min(1, "Kecamatan wajib dipilih"),
  desa_id: z.string().min(1, "Desa wajib dipilih"),
  visit_date: z.string().min(1, "Tanggal kunjungan wajib diisi"),
  notes: z.string().optional(),
  cgr: z.string().optional(),
  cgr_code: z.string().optional(),
  block_no: z.string().optional(),
  no_plot: z.string().optional(),
  member_name: z.string().optional(),
  document_no: z.string().optional(),
  nis: z.string().optional(),
  ph_tanah: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), "PH Tanah harus berupa angka"),
  real_tanam_ha: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), "Real Tanam harus berupa angka"),
  gagal_tanam: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), "Gagal Tanam harus berupa angka"),
  sisa_di_lahan_ha: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), "Sisa di Lahan harus berupa angka"),
  tgl_tanam: z.string().optional(),
  tgl_panen: z.string().optional(),
  panen_keterangan: z.string().optional(),
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
