-- Enforce app-level dedupe key (user_id|desa_id|visit_date|block_no|no_plot|member_name)
-- as a partial unique index so future imports can never create duplicates again.
-- COALESCE matches the app's composite key (null treated as '').
-- Partial: only active rows; soft-deleted rows may repeat.
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_dedupe_key
  ON schedules (
    user_id,
    desa_id,
    visit_date,
    COALESCE(block_no, ''),
    COALESCE(no_plot, ''),
    COALESCE(member_name, '')
  )
  WHERE deleted_at IS NULL;
