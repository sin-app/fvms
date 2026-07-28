CREATE INDEX IF NOT EXISTS idx_schedules_active
  ON schedules(visit_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_schedules_label
  ON schedules(label);
