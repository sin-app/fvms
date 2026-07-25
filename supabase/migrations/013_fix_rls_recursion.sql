-- Fix RLS policies that cause infinite recursion.
-- The previous policies used subqueries like:
--   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
-- This recursively queries the users table under RLS, causing 500 errors.
--
-- Fix: read the role directly from the JWT claim instead.

-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can manage kabupaten" ON kabupaten;
DROP POLICY IF EXISTS "Admins can manage kecamatan" ON kecamatan;
DROP POLICY IF EXISTS "Admins can manage desa" ON desa;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON schedules;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;

-- Add QC-specific policy for users table: QC can see all users too (for picking produksi users in assignments)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'qc'));

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- QC can also update user kabupaten assignments
CREATE POLICY "QC can update user assignments"
  ON users FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'qc')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'qc');

CREATE POLICY "Admins can manage kabupaten"
  ON kabupaten FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage kecamatan"
  ON kecamatan FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage desa"
  ON desa FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage all schedules"
  ON schedules FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
