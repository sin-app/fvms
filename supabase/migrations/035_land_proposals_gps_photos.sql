-- ============================================================
-- 035_land_proposals_gps_photos.sql
-- Tambah GPS + foto pada pengajuan lahan:
--   - land_proposals: kolom latitude/longitude/accuracy
--   - tabel land_proposal_photos (dokumentasi lahan yang diajukan)
--   - bucket storage privat 'land-proposal-photos'
-- Upload foto lewat server action (service-role), jadi RLS storage
-- untuk client tidak dibutuhkan; RLS tabel foto = defense-in-depth
-- mengikuti scope land_proposals.
-- ============================================================

ALTER TABLE land_proposals
  ADD COLUMN IF NOT EXISTS latitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS accuracy  NUMERIC;

CREATE TABLE IF NOT EXISTS land_proposal_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  UUID NOT NULL REFERENCES land_proposals(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  thumbnail    TEXT,
  caption      VARCHAR(500),
  file_size    INTEGER,
  mime_type    VARCHAR(50),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_proposal_photos_proposal
  ON land_proposal_photos (proposal_id);

-- Bucket privat untuk foto pengajuan (batas sama dengan visit-photos).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'land-proposal-photos',
  'land-proposal-photos',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- RLS land_proposal_photos (mengikuti scope land_proposals)
-- ============================================================
ALTER TABLE land_proposal_photos ENABLE ROW LEVEL SECURITY;

-- SELECT: lihat foto jika proposal terlihat (pemilik / admin / QC scope).
DROP POLICY IF EXISTS "lp_photos_select" ON land_proposal_photos;
CREATE POLICY "lp_photos_select" ON land_proposal_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_proposals lp
      WHERE lp.id = land_proposal_photos.proposal_id
        AND (
          lp.proposed_by = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
          OR (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'qc'
            AND lp.kabupaten_id = ANY (
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
    )
  );

-- INSERT: pemilik proposal yang masih pending, atau admin.
DROP POLICY IF EXISTS "lp_photos_insert" ON land_proposal_photos;
CREATE POLICY "lp_photos_insert" ON land_proposal_photos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM land_proposals lp
      WHERE lp.id = land_proposal_photos.proposal_id
        AND (
          (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'produksi'
            AND lp.proposed_by = auth.uid()
            AND lp.status = 'pending'
          )
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

-- DELETE: pemilik proposal yang masih pending, atau admin.
DROP POLICY IF EXISTS "lp_photos_delete" ON land_proposal_photos;
CREATE POLICY "lp_photos_delete" ON land_proposal_photos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM land_proposals lp
      WHERE lp.id = land_proposal_photos.proposal_id
        AND (
          (
            (auth.jwt() -> 'app_metadata' ->> 'role') = 'produksi'
            AND lp.proposed_by = auth.uid()
            AND lp.status = 'pending'
          )
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );