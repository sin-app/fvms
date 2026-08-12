-- ============================================================
-- 034_land_proposals.sql
-- Fitur "Pengajuan Lahan Baru":
--   - produksi mengajukan lahan/plot baru (status pending)
--   - QC (dalam kabupaten tugas) atau admin melakukan acc
--     -> approve : otomatis insert ke tabel schedules (owner awal = si acc,
--                  nanti di-reassign via Assign Petugas), set created_schedule_id
--     -> reject  : wajib review_note
--   - pengaju boleh edit/batalkan proposal yang masih pending
-- Tabel terpisah dari schedules agar tidak mengganggu unique index plot
-- dan trigger 033 (restrict produksi updates).
-- ============================================================

CREATE TABLE IF NOT EXISTS land_proposals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_by          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  kabupaten_id         UUID NOT NULL REFERENCES kabupaten(id),
  kecamatan_id         UUID NOT NULL REFERENCES kecamatan(id),
  desa_id              UUID NOT NULL REFERENCES desa(id),
  block_no             TEXT,
  no_plot              TEXT,
  document_no          TEXT,
  member_name          TEXT,
  cgr                  TEXT,
  cgr_code             TEXT,
  nis                  TEXT,
  ph_tanah             NUMERIC,
  real_tanam_ha        NUMERIC,
  detaseling           TEXT,
  tgl_tanam            DATE,
  rencana_panen        DATE,
  notes                TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  review_note          TEXT,
  created_schedule_id  UUID REFERENCES schedules(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_land_proposals_kabupaten ON land_proposals (kabupaten_id);
CREATE INDEX IF NOT EXISTS idx_land_proposals_status ON land_proposals (status);
CREATE INDEX IF NOT EXISTS idx_land_proposals_proposed_by ON land_proposals (proposed_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at_land_proposals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_land_proposals_updated_at ON land_proposals;
CREATE TRIGGER trg_land_proposals_updated_at
  BEFORE UPDATE ON land_proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_land_proposals();

-- ============================================================
-- RLS (pola JWT app_metadata, sama seperti migrasi 016/032)
-- ============================================================
ALTER TABLE land_proposals ENABLE ROW LEVEL SECURITY;

-- SELECT: pengaju lihat miliknya; admin semua; QC hanya kabupaten tugasnya.
DROP POLICY IF EXISTS "land_proposals_select" ON land_proposals;
CREATE POLICY "land_proposals_select" ON land_proposals FOR SELECT TO authenticated
  USING (
    proposed_by = auth.uid()
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

-- INSERT: produksi hanya untuk dirinya; admin bebas.
DROP POLICY IF EXISTS "land_proposals_insert" ON land_proposals;
CREATE POLICY "land_proposals_insert" ON land_proposals FOR INSERT TO authenticated
  WITH CHECK (
    (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'produksi'
      AND proposed_by = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- UPDATE review (QC/admin): ubah status -> approved/rejected + review_note.
DROP POLICY IF EXISTS "land_proposals_review_qc" ON land_proposals;
CREATE POLICY "land_proposals_review_qc" ON land_proposals FOR UPDATE TO authenticated
  USING (
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
  WITH CHECK (
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
  );

DROP POLICY IF EXISTS "land_proposals_review_admin" ON land_proposals;
CREATE POLICY "land_proposals_review_admin" ON land_proposals FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- UPDATE pemilik (produksi): edit/batalkan proposal yang masih pending.
DROP POLICY IF EXISTS "land_proposals_owner_update" ON land_proposals;
CREATE POLICY "land_proposals_owner_update" ON land_proposals FOR UPDATE TO authenticated
  USING (proposed_by = auth.uid() AND status = 'pending')
  WITH CHECK (proposed_by = auth.uid() AND status = 'pending');
