import { createAdminClient } from "@/lib/supabase/admin-client";
import { getConfig } from "@/lib/config";
import { getAuthContext, canAccessSchedule } from "@/lib/auth/authorization";

export async function getVisitDetail(scheduleId: string) {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  if (!(await canAccessSchedule(scheduleId, ctx))) return null;

  const admin = createAdminClient();
  const { data: schedule } = await admin
    .from("schedules")
    .select("*, kabupaten!inner(name), kecamatan!inner(name), desa!inner(name), users!schedules_user_id_fkey(name, email)")
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

  const signedPhotos = await Promise.all(
    (photos ?? []).map(async (p) => ({
      ...p,
      url: await signPhotoUrl(p.url),
    })),
  );

  return {
    ...schedule,
    visit_notes: notes ?? null,
    visit_photos: signedPhotos,
  };
}

const PHOTO_SIGN_TTL_SECONDS = 60 * 60;

async function signPhotoUrl(objectPath: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("visit-photos")
      .createSignedUrl(objectPath, PHOTO_SIGN_TTL_SECONDS);
    return data?.signedUrl ?? "";
  } catch {
    return "";
  }
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
  const config = getConfig();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `visits/${scheduleId}/${crypto.randomUUID()}.${ext}`;

  const buffer = new Uint8Array(await file.arrayBuffer());
  const contentType = file.type || "image/jpeg";

  // Verify the actual file content (magic bytes) instead of trusting the
  // client-supplied Content-Type, to prevent arbitrary file uploads.
  if (!isImageBuffer(buffer)) {
    throw new Error("File bukan gambar yang valid (JPG/PNG/WebP)");
  }

  // 1) Upload the binary to Supabase Storage via the REST API using the
  //    service-role key. Avoids the supabase-js storage client quirks in the
  //    server-action runtime.
  const uploadRes = await fetch(
    `${config.supabaseUrl}/storage/v1/object/visit-photos/${filePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        apikey: config.supabaseServiceRoleKey,
        "Content-Type": contentType,
        "Cache-Control": "3600",
        "x-upsert": "false",
      },
      body: buffer,
    },
  );

  const uploadBodyText = await uploadRes.text();
  if (!uploadRes.ok) {
    throw new Error(
      `STORAGE_UPLOAD_HTTP_${uploadRes.status}: ${uploadBodyText.slice(0, 300)}`,
    );
  }

  let uploadJson: { Key?: string } = {};
  try {
    uploadJson = JSON.parse(uploadBodyText);
  } catch {
    // ignore non-json
  }

  // Bucket is private: store the object path (relative to bucket). Signed URLs
  // are generated on read so photos are never publicly accessible by URL.
  const objectPath = filePath;

  // 2) Insert the photo metadata row via the PostgREST API directly. Using a
  //    raw fetch (instead of the supabase-js client) avoids the
  //    "unexpected response" parsing quirk for server actions.
  const insertRes = await fetch(
    `${config.supabaseUrl}/rest/v1/visit_photos`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        apikey: config.supabaseServiceRoleKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        schedule_id: scheduleId,
        url: objectPath,
        file_size: file.size,
        mime_type: contentType,
      }),
    },
  );

  const insertBodyText = await insertRes.text();
  if (!insertRes.ok) {
    throw new Error(
      `DB_INSERT_HTTP_${insertRes.status}: ${insertBodyText.slice(0, 300)}`,
    );
  }

  let inserted: { url: string; file_size: number; mime_type: string };
  try {
    const rows = JSON.parse(insertBodyText);
    inserted = Array.isArray(rows) ? rows[0] : rows;
  } catch {
    // Storage succeeded; return what we know.
    inserted = { url: objectPath, file_size: file.size, mime_type: contentType };
  }

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

export async function updateVisitPhoto(
  photoId: string,
  caption: string | null,
): Promise<{ id: string; caption: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("visit_photos")
    .update({ caption: caption === "" ? null : caption })
    .eq("id", photoId)
    .select("id, caption")
    .single();

  if (error) throw new Error(`DB_UPDATE_ERROR: ${error.message}`);
  return data;
}

export async function deleteVisitPhoto(photoId: string) {
  const admin = createAdminClient();
  const { data: photo } = await admin
    .from("visit_photos")
    .select("url, schedule_id")
    .eq("id", photoId)
    .single();

  // `url` stores the object path relative to the bucket (private bucket).
  if (photo?.url) {
    await admin.storage.from("visit-photos").remove([photo.url]);
  }

  const { error } = await admin
    .from("visit_photos")
    .delete()
    .eq("id", photoId);

  if (error) throw error;
}

export async function getVisitTimeline(scheduleId: string) {
  const ctx = await getAuthContext();
  if (!ctx || !(await canAccessSchedule(scheduleId, ctx))) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("activity_logs")
    .select("*, users!activity_logs_user_id_fkey(name)")
    .eq("entity_id", scheduleId)
    .eq("entity_type", "schedules")
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

// Validate image content by checking magic bytes (JPEG/PNG/WebP).
function isImageBuffer(buf: Uint8Array): boolean {
  if (buf.length < 12) return false;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return true;
  }
  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return true;
  }
  return false;
}
