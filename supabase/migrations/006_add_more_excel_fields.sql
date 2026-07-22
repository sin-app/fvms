-- Capture additional Excel import fields
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS document_no text,
  ADD COLUMN IF NOT EXISTS ph_tanah numeric,
  ADD COLUMN IF NOT EXISTS nis text;
