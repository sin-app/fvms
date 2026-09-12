-- 038_fix_lp_photos_rls.sql
-- Sinkronkan RLS land_proposal_photos dengan land_proposals (migration 037).
-- Sebelumnya photos RLS masih pakai JWT app_metadata → QC gagal akses.

DROP POLICY IF EXISTS "lp_photos_select" ON land_proposal_photos;
CREATE POLICY "lp_photos_select" ON land_proposal_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_proposals lp
      WHERE lp.id = land_proposal_photos.proposal_id
        AND (
          lp.proposed_by = auth.uid()
          OR current_user_role() = 'admin'
          OR (
            current_user_role() = 'qc'
            AND lp.kabupaten_id = ANY (current_user_kabupaten_ids())
          )
        )
    )
  );

DROP POLICY IF EXISTS "lp_photos_insert" ON land_proposal_photos;
CREATE POLICY "lp_photos_insert" ON land_proposal_photos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_proposals lp
      WHERE lp.id = land_proposal_photos.proposal_id
        AND (
          (
            current_user_role() = 'produksi'
            AND lp.proposed_by = auth.uid()
            AND lp.status = 'pending'
          )
          OR current_user_role() = 'admin'
        )
    )
  );

DROP POLICY IF EXISTS "lp_photos_delete" ON land_proposal_photos;
CREATE POLICY "lp_photos_delete" ON land_proposal_photos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_proposals lp
      WHERE lp.id = land_proposal_photos.proposal_id
        AND (
          (
            current_user_role() = 'produksi'
            AND lp.proposed_by = auth.uid()
            AND lp.status = 'pending'
          )
          OR current_user_role() = 'admin'
        )
    )
  );
