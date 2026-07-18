ALTER TABLE excel_imports
  ADD COLUMN IF NOT EXISTS created_master JSONB;
