-- Allow admin to SELECT all import records
CREATE POLICY "Admin can view all imports"
  ON excel_imports FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin' OR user_id = auth.uid());

-- Drop old insert policy, replace with one that allows admin too
DROP POLICY IF EXISTS "Users can create own imports" ON excel_imports;
CREATE POLICY "Users can create own imports"
  ON excel_imports FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR user_id = auth.uid());

-- Allow admin to restore/delete imports
CREATE POLICY "Admin can delete imports"
  ON excel_imports FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
