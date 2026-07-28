-- Set status in_progress for schedules that have visit data (notes, photos, or GPS)
-- but are not already in_progress, completed, or gagal_total.

WITH has_activity AS (
  SELECT DISTINCT s.id
  FROM schedules s
  LEFT JOIN visit_notes vn ON vn.schedule_id = s.id
  LEFT JOIN visit_photos vp ON vp.schedule_id = s.id
  WHERE s.deleted_at IS NULL
    AND s.status IS DISTINCT FROM 'in_progress'
    AND s.status IS DISTINCT FROM 'completed'
    AND s.status IS DISTINCT FROM 'gagal_total'
    AND (
      vn.id IS NOT NULL
      OR vp.id IS NOT NULL
      OR s.latitude IS NOT NULL
      OR s.longitude IS NOT NULL
    )
)
UPDATE schedules
SET status = 'in_progress', updated_at = now()
FROM has_activity
WHERE schedules.id = has_activity.id;
