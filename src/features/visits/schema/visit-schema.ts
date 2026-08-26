import { STATUS_VALUES } from "@/lib/constants/status";
import { z } from "zod";

export const visitNotesSchema = z.object({
  schedule_id: z.string().min(1),
  observation: z.string().optional(),
  problem: z.string().optional(),
  recommend: z.string().optional(),
  additional: z.string().optional(),
});

export type VisitNotesInput = z.infer<typeof visitNotesSchema>;

export const visitStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([STATUS_VALUES.pending, STATUS_VALUES.in_progress, STATUS_VALUES.gagal_partial, STATUS_VALUES.completed, STATUS_VALUES.gagal_total]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracy: z.number().optional(),
});

export type VisitStatusInput = z.infer<typeof visitStatusSchema>;
