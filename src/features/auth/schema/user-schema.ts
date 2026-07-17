import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["admin", "supervisor", "field_officer"]),
  phone: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type UserInput = z.infer<typeof userSchema>;
