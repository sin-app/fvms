ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS rencana_panen DATE,
  ADD COLUMN IF NOT EXISTS real_panen DATE;

CREATE INDEX IF NOT EXISTS idx_schedules_rencana_panen ON schedules(rencana_panen);
CREATE INDEX IF NOT EXISTS idx_schedules_real_panen ON schedules(real_panen);
