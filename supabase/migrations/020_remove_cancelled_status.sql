-- Remove cancelled from visit_status enum.
-- Postgres does not support DROP VALUE, so we recreate the enum.

-- First convert any existing 'cancelled' rows to 'gagal_total'
UPDATE schedules SET status = 'gagal_total' WHERE status = 'cancelled';

-- Create new enum without cancelled
CREATE TYPE visit_status_new AS ENUM ('pending', 'on_the_way', 'in_progress', 'completed', 'gagal_total');

-- Update column to use new type, preserving DEFAULT
ALTER TABLE schedules
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE visit_status_new
  USING (CASE WHEN status = 'cancelled' THEN 'gagal_total'::text ELSE status::text END)::visit_status_new,
  ALTER COLUMN status SET DEFAULT 'pending'::visit_status_new;

-- Drop old type and rename new one
DROP TYPE visit_status;
ALTER TYPE visit_status_new RENAME TO visit_status;
