-- Add gagal_total to visit_status enum
ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'gagal_total';

-- Add label column to schedules (kuning / merah / null)
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS label text CHECK (label IS NULL OR label IN ('kuning', 'merah'));
