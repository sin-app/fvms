import { createAdminClient } from "@/lib/supabase/admin-client";

export async function getVisitDetail(scheduleId: string) {
  const admin = createAdminClient();
  const { data: schedule } = await admin
    .from("schedules")
    .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), user!inner(name, email)")
    .eq("id", scheduleId)
    .single();

  if (!schedule) return null;

  const { data: notes } = await admin
    .from("visit_notes")
    .select("*")
    .eq("schedule_id", scheduleId)
    .maybeSingle();

  const { data: photos } = await admin
    .from("visit_photos")
    .select("*")
    .eq("schedule_id", scheduleId)
    .order("created_at", { ascending: true });

  return {
    ...schedule,
    visit_notes: notes ?? null,
    visit_photos: photos ?? [],
  };
}

export async function saveVisitNotes(data: {
  schedule_id: string;
  observation?: string;
  problem?: string;
  recommend?: string;
  additional?: string;
}) {
  const admin = createAdminClient();
  const existing = await admin
    .from("visit_notes")
    .select("id")
    .eq("schedule_id", data.schedule_id)
    .maybeSingle();

  if (existing.data) {
    const { error } = await admin
      .from("visit_notes")
      .update({
        observation: data.observation ?? null,
        problem: data.problem ?? null,
        recommend: data.recommend ?? null,
        additional: data.additional ?? null,
      })
      .eq("id", existing.data.id);

    if (error) throw error;
  } else {
    const { error } = await admin
      .from("visit_notes")
      .insert(data);

    if (error) throw error;
  }
}

export async function uploadVisitPhoto(
  scheduleId: string,
  file: File,
): Promise<{ url: string; file_size: number; mime_type: string }> {
  const admin = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `visits/${scheduleId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("visit-photos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = admin.storage
    .from("visit-photos")
    .getPublicUrl(filePath);

  const photo = {
    schedule_id: scheduleId,
    url: urlData.publicUrl,
    file_size: file.size,
    mime_type: file.type,
  };

  const { data: inserted, error: insertError } = await admin
    .from("visit_photos")
    .insert(photo)
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}

export async function getOwnedPhoto(photoId: string, scheduleId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("visit_photos")
    .select("id, url, schedule_id")
    .eq("id", photoId)
    .eq("schedule_id", scheduleId)
    .maybeSingle();

  return data ?? null;
}

export async function deleteVisitPhoto(photoId: string) {
  const admin = createAdminClient();
  const { data: photo } = await admin
    .from("visit_photos")
    .select("url, schedule_id")
    .eq("id", photoId)
    .single();

  if (photo?.url) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/visit-photos/`;
    const path = photo.url.startsWith(prefix)
      ? photo.url.slice(prefix.length)
      : photo.url.split("/").pop() ?? "";
    if (path) {
      await admin.storage.from("visit-photos").remove([path]);
    }
  }

  const { error } = await admin
    .from("visit_photos")
    .delete()
    .eq("id", photoId);

  if (error) throw error;
}

export async function getVisitTimeline(scheduleId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("activity_logs")
    .select("*, user!inner(name)")
    .eq("entity_id", scheduleId)
    .eq("entity_type", "schedules")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}
