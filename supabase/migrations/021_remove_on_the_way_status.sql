-- Remove on_the_way from visit_status enum.
-- Convert existing on_the_way rows to in_progress.

UPDATE schedules SET status = 'in_progress' WHERE status = 'on_the_way';

CREATE TYPE visit_status_new AS ENUM ('pending', 'in_progress', 'completed', 'gagal_total');

ALTER TABLE schedules
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE visit_status_new
  USING (CASE WHEN status = 'on_the_way' THEN 'in_progress'::text ELSE status::text END)::visit_status_new,
  ALTER COLUMN status SET DEFAULT 'pending'::visit_status_new;

DROP TYPE visit_status;
ALTER TYPE visit_status_new RENAME TO visit_status;
