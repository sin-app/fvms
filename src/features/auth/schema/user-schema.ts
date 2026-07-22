import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["admin", "qc", "produksi"]),
  phone: z.string().optional(),
  is_active: z.boolean().default(true),
  assigned_kabupaten_ids: z.array(z.string()).default([]),
});

export type UserInput = z.infer<typeof userSchema>;
