import { z } from "zod";

export const landProposalSchema = z.object({
  kabupaten_id: z.string().min(1, "Kabupaten wajib dipilih"),
  kecamatan_id: z.string().min(1, "Kecamatan wajib dipilih"),
  desa_id: z.string().min(1, "Desa wajib dipilih"),
  block_no: z.string().optional(),
  no_plot: z.string().optional(),
  document_no: z.string().optional(),
  member_name: z.string().optional(),
  cgr: z.string().optional(),
  cgr_code: z.string().optional(),
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
  detaseling: z.string().optional(),
  tgl_tanam: z.string().optional(),
  rencana_panen: z.string().optional(),
  notes: z.string().optional(),
});

export type LandProposalInput = z.infer<typeof landProposalSchema>;

export const landProposalReviewSchema = z.object({
  review_note: z.string().min(1, "Catatan wajib diisi saat menolak"),
});

export type LandProposalReviewInput = z.infer<typeof landProposalReviewSchema>;
