-- Rename the "supervisor" role to "qc" (Quality Control) and the
-- "field_officer" role to "produksi" (Production).
-- QC can view all Produksi schedules for inspection and assessment.

-- 1. Rename enum values (PostgreSQL 14+).
ALTER TYPE user_role RENAME VALUE 'supervisor' TO 'qc';
ALTER TYPE user_role RENAME VALUE 'field_officer' TO 'produksi';

-- 2. Recreate RLS policies that referenced the old role labels so QC and
--    Produksi inherit the correct "view all" / "view own" privileges.

DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'qc'))
  );

DROP POLICY IF EXISTS "Field officers can view own visit notes" ON visit_notes;
CREATE POLICY "Field officers can view own visit notes"
  ON visit_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE schedules.id = visit_notes.schedule_id AND schedules.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'qc'))
  );

DROP POLICY IF EXISTS "Field officers can view own visit photos" ON visit_photos;
CREATE POLICY "Field officers can view own visit photos"
  ON visit_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE schedules.id = visit_photos.schedule_id AND schedules.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'qc'))
  );
