-- Replace full-table UNIQUE(code) constraints with partial unique indexes
-- that only enforce uniqueness among non-deleted rows. This allows
-- re-creating a kabupaten/kecamatan/desa with the same code after a
-- soft delete (deleted_at IS NOT NULL).

ALTER TABLE kabupaten DROP CONSTRAINT IF EXISTS kabupaten_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_kabupaten_code_active ON kabupaten(code) WHERE deleted_at IS NULL;

ALTER TABLE kecamatan DROP CONSTRAINT IF EXISTS kecamatan_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_kecamatan_code_active ON kecamatan(code, kabupaten_id) WHERE deleted_at IS NULL;

ALTER TABLE desa DROP CONSTRAINT IF EXISTS desa_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_desa_code_active ON desa(code, kecamatan_id) WHERE deleted_at IS NULL;
