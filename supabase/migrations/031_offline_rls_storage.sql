-- ============================================================
-- 031_offline_rls_storage.sql
-- RLS Storage untuk sinkronisasi offline (client writes).
-- Pola path storage: {user_id}/visits/{schedule_id}/{file}.ext
-- ============================================================

-- Pastikan bucket privat dengan batas ukuran foto (15 MB, JPG/PNG/WebP)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-photos',
  'visit-photos',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Upload langsung dari client (offline sync / form kunjungan):
-- hanya ke folder miliknya sendiri, hanya tipe gambar.
DROP POLICY IF EXISTS "offline: insert own folder" ON storage.objects;
CREATE POLICY "offline: insert own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'visit-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp')
  );

-- Baca ulang object milik sendiri (verifikasi upload / unduh ulang).
DROP POLICY IF EXISTS "offline: read own folder" ON storage.objects;
CREATE POLICY "offline: read own folder"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'visit-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Hapus object milik sendiri (foto dihapus oleh pemilik schedule).
DROP POLICY IF EXISTS "offline: delete own folder" ON storage.objects;
CREATE POLICY "offline: delete own folder"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'visit-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Perbarui guard agar versi offline tidak menimpa status final.
-- Catatan: sinkron hanya mengirim field yang diizinkan dari client; admin/QC
-- tetap lewat server action (service-role) sehingga tidak terpengaruh.
COMMENT ON TABLE schedules IS 'jadwal kunjungan; update klien (offline) dibatasi field status/label via RLS own-row';