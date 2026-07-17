-- ============================================================
-- FVMS - Seed Data
-- Create initial admin user and sample master data
-- ============================================================

-- Note: The auth.users entry must be created via Supabase Auth
-- (sign up or admin API). This script creates the public.users
-- record and sample master data.

-- 1. Create admin user in public.users
-- (Replace the ID with the actual auth.users ID after creating the user)
-- INSERT INTO public.users (id, email, name, role)
-- VALUES ('REPLACE_WITH_AUTH_USER_ID', 'admin@fvms.com', 'Admin FVMS', 'admin');

-- 2. Sample Kabupaten
INSERT INTO kabupaten (id, name, code) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Kabupaten A', 'KA-01'),
  ('a0000001-0000-0000-0000-000000000002', 'Kabupaten B', 'KA-02'),
  ('a0000001-0000-0000-0000-000000000003', 'Kabupaten C', 'KA-03');

-- 3. Sample Kecamatan
INSERT INTO kecamatan (id, kabupaten_id, name, code) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Kecamatan A1', 'KC-A1'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Kecamatan A2', 'KC-A2'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Kecamatan B1', 'KC-B1'),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Kecamatan B2', 'KC-B2'),
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'Kecamatan C1', 'KC-C1');

-- 4. Sample Desa
INSERT INTO desa (id, kecamatan_id, name, code) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Desa A1-1', 'DS-A11'),
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'Desa A1-2', 'DS-A12'),
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000002', 'Desa A2-1', 'DS-A21'),
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000003', 'Desa B1-1', 'DS-B11'),
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000003', 'Desa B1-2', 'DS-B12'),
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000004', 'Desa B2-1', 'DS-B21'),
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000005', 'Desa C1-1', 'DS-C11'),
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000005', 'Desa C1-2', 'DS-C12');
