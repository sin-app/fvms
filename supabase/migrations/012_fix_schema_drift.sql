-- Fix schema drift between TypeScript types and database

-- 1. Add missing columns to public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS assigned_kabupaten_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.users.assigned_kabupaten_ids IS 'Kabupaten IDs assigned to QC users for wilayah tugas scope';
COMMENT ON COLUMN public.users.deleted_at IS 'Soft delete timestamp';

-- 2. Add index for soft-deleted users (useful for admin queries)
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NOT NULL;
