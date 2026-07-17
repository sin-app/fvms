/**
 * Seed script to create admin user and initial data.
 *
 * Usage:
 * 1. First create a user via Supabase Auth (signup or dashboard)
 * 2. Run: npx ts-node scripts/seed.ts
 *
 * Or run the SQL in supabase/migrations/002_seed.sql via Supabase SQL Editor
 * after creating the admin user in Auth.
 */

// This is a reference script. The actual seeding should be done
// via Supabase SQL Editor or dashboard for security reasons.
// See supabase/migrations/002_seed.sql

console.log(`
To create admin user:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite user" or "Add user"
3. Enter: admin@fvms.com with a secure password
4. Copy the generated User ID (UUID)

5. Go to SQL Editor and run:

INSERT INTO public.users (id, email, name, role)
VALUES ('PASTE_USER_ID_HERE', 'admin@fvms.com', 'Admin FVMS', 'admin');

6. Then run supabase/migrations/002_seed.sql for sample data
`);
