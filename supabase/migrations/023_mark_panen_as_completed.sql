-- Set status completed for schedules that already have harvest data.
UPDATE schedules
SET status = 'completed'
WHERE (tgl_panen IS NOT NULL OR real_panen IS NOT NULL)
  AND status != 'completed'
  AND status != 'gagal_total'
  AND deleted_at IS NULL;
