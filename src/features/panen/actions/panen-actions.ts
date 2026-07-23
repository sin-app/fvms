"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getAuthContext, canAccessSchedule } from "@/lib/auth/authorization";
import { panenSchema } from "../schema/panen-schema";
import type { ActionResponse } from "@/types/common";

export async function savePanenAction(
  prevState: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const raw = {
    schedule_id: formData.get("schedule_id") as string,
    tgl_panen: (formData.get("tgl_panen") as string) || undefined,
    panen_keterangan: (formData.get("panen_keterangan") as string) || undefined,
  };

  const parsed = panenSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validasi gagal",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (!(await canAccessSchedule(raw.schedule_id, ctx))) {
    return { success: false, error: "Tidak memiliki akses ke jadwal ini" };
  }

  try {
    const admin = createAdminClient();
    const update: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.tgl_panen) {
      update.tgl_panen = parsed.data.tgl_panen;
    } else {
      update.tgl_panen = null;
    }
    if (parsed.data.panen_keterangan) {
      update.panen_keterangan = parsed.data.panen_keterangan;
    } else {
      update.panen_keterangan = null;
    }

    const { error } = await admin
      .from("schedules")
      .update(update)
      .eq("id", raw.schedule_id);

    if (error) throw error;

    await admin.from("activity_logs").insert({
      user_id: ctx.userId,
      action: parsed.data.tgl_panen ? "panen_set" : "panen_cleared",
      entity_type: "schedules",
      entity_id: raw.schedule_id,
      metadata: { tgl_panen: parsed.data.tgl_panen ?? null },
    });

    revalidatePath(`/visits/${raw.schedule_id}`);
    revalidatePath("/schedules");
    revalidatePath("/reports");

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan data panen";
    return { success: false, error: msg };
  }
}
