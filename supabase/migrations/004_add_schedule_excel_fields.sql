-- Add columns to capture all Excel import fields
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS cgr text,
  ADD COLUMN IF NOT EXISTS cgr_code text,
  ADD COLUMN IF NOT EXISTS block_no text,
  ADD COLUMN IF NOT EXISTS no_plot text,
  ADD COLUMN IF NOT EXISTS member_name text,
  ADD COLUMN IF NOT EXISTS real_tanam_ha numeric,
  ADD COLUMN IF NOT EXISTS gagal_tanam numeric,
  ADD COLUMN IF NOT EXISTS sisa_di_lahan_ha numeric,
  ADD COLUMN IF NOT EXISTS detaseling text,
  ADD COLUMN IF NOT EXISTS tgl_tanam date;

