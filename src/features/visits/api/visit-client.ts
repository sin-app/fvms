"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getVisitDetail, getVisitTimeline } from "../services/visit-service";

export async function fetchVisitDetail(id: string) {
  return getVisitDetail(id);
}

export async function fetchVisitTimeline(scheduleId: string) {
  return getVisitTimeline(scheduleId);
}

/** Membuat signed URL (1 jam) untuk path foto yang tidak punya blob lokal. */
export async function fetchSignedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const admin = createAdminClient();
  const entries = await Promise.all(
    paths.map(async (path) => {
      const { data } = await admin.storage
        .from("visit-photos")
        .createSignedUrl(path, 60 * 60);
      return [path, data?.signedUrl ?? ""] as const;
    }),
  );
  return Object.fromEntries(entries);
}
