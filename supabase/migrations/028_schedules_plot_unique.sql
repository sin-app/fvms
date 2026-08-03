-- Replace the old dedupe index (which included visit_date) with the
-- domain-level plot identity: (desa_id, block_no, no_plot, member_name).
-- A plot is unique per desa regardless of visit_date, so re-imports with a
-- shifted visit_date update the existing row instead of inserting a duplicate.
-- lower(btrim()) matches the app's makeKey() normalization.
-- Partial: only rows that actually identify a plot; soft-deleted rows may repeat.
DROP INDEX IF EXISTS idx_schedules_dedupe_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_plot_unique
  ON schedules (
    desa_id,
    lower(btrim(block_no)),
    lower(btrim(no_plot)),
    lower(btrim(member_name))
  )
  WHERE deleted_at IS NULL
    AND block_no IS NOT NULL
    AND no_plot IS NOT NULL
    AND member_name IS NOT NULL;
