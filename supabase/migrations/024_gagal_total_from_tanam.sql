-- Set status gagal_total for schedules where all planted area failed.
-- real_tanam_ha - gagal_tanam <= 0 means the entire crop failed.

UPDATE schedules
SET status = 'gagal_total'
WHERE real_tanam_ha IS NOT NULL
  AND gagal_tanam IS NOT NULL
  AND (real_tanam_ha - gagal_tanam) <= 0
  AND status != 'gagal_total'
  AND deleted_at IS NULL;
