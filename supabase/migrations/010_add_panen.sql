-- Add panen (harvest) tracking fields to schedules
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS tgl_panen DATE,
  ADD COLUMN IF NOT EXISTS panen_keterangan TEXT;

-- Index for filtering by harvest status
CREATE INDEX IF NOT EXISTS idx_schedules_tgl_panen ON schedules(tgl_panen);
