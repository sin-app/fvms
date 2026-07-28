-- Remove gagal_tanam from visit_status enum.
-- PostgreSQL cannot remove a value from an enum, so we recreate it.

-- 1. Create a new type without gagal_tanam
CREATE TYPE visit_status_new AS ENUM ('pending', 'on_the_way', 'in_progress', 'completed', 'cancelled');

-- 2. Update the schedules table to use the new type
--    Convert any 'gagal_tanam' rows to 'cancelled' since they represent failure
ALTER TABLE schedules
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE visit_status_new
  USING (CASE WHEN status = 'gagal_tanam' THEN 'cancelled'::text ELSE status::text END)::visit_status_new,
  ALTER COLUMN status SET DEFAULT 'pending'::visit_status_new;

-- 3. Drop the old type (safe because schedules column now uses the new type)
DROP TYPE visit_status;

-- 4. Rename the new type to the original name
ALTER TYPE visit_status_new RENAME TO visit_status;
