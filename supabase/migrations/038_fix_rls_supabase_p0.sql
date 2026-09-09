-- P0 fix Supabase RLS & audit

-- 1) excel_imports: was using auth.jwt()->>'role' (top-level) which never matches.
--    Use (auth.jwt() -> 'app_metadata' ->> 'role') like other policies and 037's current_user_role().
DROP POLICY IF EXISTS "Admin can view all imports" ON excel_imports;
CREATE POLICY "Admin can view all imports"
  ON excel_imports FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own imports" ON excel_imports;
CREATE POLICY "Users can create own imports"
  ON excel_imports FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can delete imports" ON excel_imports;
CREATE POLICY "Admin can delete imports"
  ON excel_imports FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- 2) Harmonize visit storage RLS to use same app_metadata role source (already correct in 031)
-- No change needed, keep 031 as is.

-- 3) Ensure rate_limits stays service_role only (already correct in 007: ENABLE RLS without policy)
-- Add comment for audit clarity
COMMENT ON TABLE rate_limits IS 'RLS enabled without policy: only service_role can read/write (intentional).';
