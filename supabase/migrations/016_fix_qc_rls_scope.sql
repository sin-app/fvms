-- Fix QC RLS scoping: QC should only see schedules within their assigned kabupaten.
-- Previously, the SELECT policy used a recursive subquery that both caused
-- infinite recursion and gave QC unrestricted access to ALL rows.
--
-- Fix: drop the old recursive policies and create JWT-based policies that
-- scope QC to their assigned_kabupaten_ids (read from app_metadata).

-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can view own visit notes" ON visit_notes;
DROP POLICY IF EXISTS "Users can view own visit photos" ON visit_photos;

-- Helper: QC's assigned kabupaten IDs from JWT app_metadata (JSON array of UUIDs)
-- If the array is null/empty, QC sees nothing (no kabupaten assigned).

-- Schedules: produksi sees own, admin sees all, QC sees assigned kabupaten
CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
      AND kabupaten_id = ANY (
        SELECT value::uuid
        FROM jsonb_array_elements_text(
          COALESCE(
            (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
            '[]'::jsonb
          )
        ) AS value
      )
    )
  );

-- Visit notes: produksi sees own, admin sees all, QC sees assigned kabupaten
CREATE POLICY "Users can view own visit notes"
  ON visit_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE id = schedule_id AND user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
      AND EXISTS (
        SELECT 1 FROM schedules
        WHERE id = schedule_id
          AND kabupaten_id = ANY (
            SELECT value::uuid
            FROM jsonb_array_elements_text(
              COALESCE(
                (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
                '[]'::jsonb
              )
            ) AS value
          )
      )
    )
  );

-- Visit photos: produksi sees own, admin sees all, QC sees assigned kabupaten
CREATE POLICY "Users can view own visit photos"
  ON visit_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE id = schedule_id AND user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
      AND EXISTS (
        SELECT 1 FROM schedules
        WHERE id = schedule_id
          AND kabupaten_id = ANY (
            SELECT value::uuid
            FROM jsonb_array_elements_text(
              COALESCE(
                (auth.jwt() #> '{app_metadata, assigned_kabupaten_ids}')::jsonb,
                '[]'::jsonb
              )
            ) AS value
          )
      )
    )
  );
