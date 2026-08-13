-- Selaraskan RLS land_proposals dengan sumber kebenaran di sisi server
-- (getAuthContext membaca role & assigned_kabupaten_ids dari tabel users,
-- fail-closed). Sebelumnya RLS mengecek dari JWT app_metadata yang bisa stale
-- (assignment QC diubah tapi session belum refresh) → scope RLS menyimpang
-- dari logika aplikasi.
--
-- Pendekatan: fungsi SECURITY DEFINER membaca users tanpa memicu rekursi RLS
-- (pemilik fungsi bypass RLS pada tabel users). Ini menghindari rekursi yang
-- pernah diperbaiki di 013/016.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_kabupaten_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(assigned_kabupaten_ids, '{}') FROM users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_kabupaten_ids() TO authenticated;

DROP POLICY IF EXISTS "land_proposals_select" ON land_proposals;
CREATE POLICY "land_proposals_select" ON land_proposals FOR SELECT TO authenticated
  USING (
    proposed_by = auth.uid()
    OR current_user_role() = 'admin'
    OR (
      current_user_role() = 'qc'
      AND kabupaten_id = ANY (current_user_kabupaten_ids())
    )
  );

DROP POLICY IF EXISTS "land_proposals_insert" ON land_proposals;
CREATE POLICY "land_proposals_insert" ON land_proposals FOR INSERT TO authenticated
  WITH CHECK (
    (current_user_role() = 'produksi' AND proposed_by = auth.uid())
    OR current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "land_proposals_review_qc" ON land_proposals;
CREATE POLICY "land_proposals_review_qc" ON land_proposals FOR UPDATE TO authenticated
  USING (current_user_role() = 'qc' AND kabupaten_id = ANY (current_user_kabupaten_ids()))
  WITH CHECK (current_user_role() = 'qc' AND kabupaten_id = ANY (current_user_kabupaten_ids()));

DROP POLICY IF EXISTS "land_proposals_review_admin" ON land_proposals;
CREATE POLICY "land_proposals_review_admin" ON land_proposals FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

DROP POLICY IF EXISTS "land_proposals_owner_update" ON land_proposals;
CREATE POLICY "land_proposals_owner_update" ON land_proposals FOR UPDATE TO authenticated
  USING (proposed_by = auth.uid() AND status = 'pending')
  WITH CHECK (proposed_by = auth.uid() AND status = 'pending');
