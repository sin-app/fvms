-- Add gagal_partial to visit_status enum
ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'gagal_partial';

-- Update the label CHECK constraint to include 'hijau'
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_label_check;
ALTER TABLE schedules ADD CONSTRAINT schedules_label_check
  CHECK (label IS NULL OR label IN ('hijau', 'kuning', 'merah'));
