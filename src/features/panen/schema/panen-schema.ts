import { z } from "zod";

export const panenSchema = z.object({
  schedule_id: z.string().min(1),
  tgl_panen: z.string().optional(),
  panen_keterangan: z.string().optional(),
});

export type PanenInput = z.infer<typeof panenSchema>;
