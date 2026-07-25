-- Fix QC privilege escalation: remove RLS UPDATE access for QC on users table.
-- QC updates are handled server-side via admin client (service role), not via RLS.
-- Direct REST API access by QC should only be SELECT (view users), not UPDATE.

-- Drop the overly permissive policy that allowed QC to UPDATE any user row
DROP POLICY IF EXISTS "QC can update user assignments" ON users;

-- Keep only SELECT for QC on users table (already handled by "Admins can view all users"
-- which grants SELECT to admin + qc via JWT claim).
