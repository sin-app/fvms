-- ============================================================
-- 032_offline_rls_writes.sql
-- RLS untuk tulis-luring (outbox push via client user):
--   - produksi: boleh INSERT jadwal milik sendiri (user_id = auth.uid())
--   - QC     : boleh INSERT/UPDATE jadwal dalam kabupaten tugasnya
--   - QC     : boleh kelola visit_notes & visit_photos dalam kabupaten tugasnya
-- (UPDATE own sudah ada: "Users can update own schedules".)
-- Soft-delete jadwal lewat UPDATE deleted_at -> tercakup policy UPDATE.
-- ============================================================

-- Helper: scope kabupaten QC dari JWT app_metadata (sama seperti 016).
-- (Subquery ditulis inline di tiap policy agar tidak butuh fungsi SQL.)

-- Produksi hanya boleh membuat jadwal miliknya sendiri.
DROP POLICY IF EXISTS "Produksi can create own schedules" ON schedules;
CREATE POLICY "Produksi can create own schedules"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'produksi'
  );

-- QC boleh membuat jadwal di dalam kabupaten tugasnya.
DROP POLICY IF EXISTS "QC can create schedules in scope" ON schedules;
CREATE POLICY "QC can create schedules in scope"
  ON schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
    AND kabupaten_id = ANY (
      SELECT value::uuid
      FROM jsonb_array_elements_text(
        COALESCE(
          (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
          '[]'::jsonb
        )
      ) AS t(value)
    )
  );

-- QC boleh mengupdate jadwal di dalam kabupaten tugasnya
-- (status, label, GPS, panen, geser tanggal, soft-delete, dll).
DROP POLICY IF EXISTS "QC can update schedules in scope" ON schedules;
CREATE POLICY "QC can update schedules in scope"
  ON schedules FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
    AND kabupaten_id = ANY (
      SELECT value::uuid
      FROM jsonb_array_elements_text(
        COALESCE(
          (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
          '[]'::jsonb
        )
      ) AS t(value)
    )
  );

-- QC boleh kelola catatan kunjungan untuk jadwal di kabupaten tugasnya.
DROP POLICY IF EXISTS "QC can manage visit notes in scope" ON visit_notes;
CREATE POLICY "QC can manage visit notes in scope"
  ON visit_notes FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
    AND EXISTS (
      SELECT 1
      FROM schedules s
      WHERE s.id = visit_notes.schedule_id
        AND s.kabupaten_id = ANY (
          SELECT value::uuid
          FROM jsonb_array_elements_text(
            COALESCE(
              (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
              '[]'::jsonb
            )
          ) AS t(value)
        )
    )
  );

-- QC boleh kelola foto kunjungan untuk jadwal di kabupaten tugasnya.
DROP POLICY IF EXISTS "QC can manage visit photos in scope" ON visit_photos;
CREATE POLICY "QC can manage visit photos in scope"
  ON visit_photos FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
    AND EXISTS (
      SELECT 1
      FROM schedules s
      WHERE s.id = visit_photos.schedule_id
        AND s.kabupaten_id = ANY (
          SELECT value::uuid
          FROM jsonb_array_elements_text(
            COALESCE(
              (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
              '[]'::jsonb
            )
          ) AS t(value)
        )
    )
  );
