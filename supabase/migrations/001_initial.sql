-- ============================================================
-- FVMS - Field Visit Management System
-- Initial Database Migration
-- ============================================================

-- 1. ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'field_officer');
CREATE TYPE visit_status AS ENUM ('pending', 'on_the_way', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE import_status AS ENUM ('processing', 'completed', 'failed');

-- 2. TABLES
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'field_officer',
  avatar_url      TEXT,
  phone           VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kabupaten (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(10) NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE kecamatan (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kabupaten_id  UUID NOT NULL REFERENCES kabupaten(id) ON DELETE RESTRICT,
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(10) NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE desa (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kecamatan_id  UUID NOT NULL REFERENCES kecamatan(id) ON DELETE RESTRICT,
  name          VARCHAR(255) NOT NULL,
  code          VARCHAR(10) NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kabupaten_id  UUID NOT NULL REFERENCES kabupaten(id) ON DELETE RESTRICT,
  kecamatan_id  UUID NOT NULL REFERENCES kecamatan(id) ON DELETE RESTRICT,
  desa_id       UUID NOT NULL REFERENCES desa(id) ON DELETE RESTRICT,
  visit_date    DATE NOT NULL,
  status        visit_status NOT NULL DEFAULT 'pending',
  latitude      DECIMAL(10, 8),
  longitude     DECIMAL(11, 8),
  accuracy      DECIMAL(10, 2),
  visit_time    TIMESTAMPTZ,
  notes         TEXT,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE visit_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  observation   TEXT,
  problem       TEXT,
  recommend     TEXT,
  additional    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_id)
);

CREATE TABLE visit_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumbnail     TEXT,
  caption       VARCHAR(500),
  file_size     INTEGER,
  mime_type     VARCHAR(50),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     UUID,
  metadata      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL,
  type          notification_type NOT NULL DEFAULT 'info',
  is_read       BOOLEAN NOT NULL DEFAULT false,
  link          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE excel_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename        VARCHAR(255) NOT NULL,
  total_rows      INTEGER NOT NULL DEFAULT 0,
  success_rows    INTEGER NOT NULL DEFAULT 0,
  error_rows      INTEGER NOT NULL DEFAULT 0,
  column_mapping  JSONB,
  status          import_status NOT NULL DEFAULT 'processing',
  error_log       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_kabupaten_code ON kabupaten(code);
CREATE INDEX idx_kabupaten_active ON kabupaten(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_kecamatan_kabupaten ON kecamatan(kabupaten_id);
CREATE INDEX idx_kecamatan_code ON kecamatan(code);
CREATE INDEX idx_kecamatan_active ON kecamatan(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_desa_kecamatan ON desa(kecamatan_id);
CREATE INDEX idx_desa_code ON desa(code);
CREATE INDEX idx_desa_active ON desa(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_schedules_date ON schedules(visit_date);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_kabupaten ON schedules(kabupaten_id);
CREATE INDEX idx_schedules_kecamatan ON schedules(kecamatan_id);
CREATE INDEX idx_schedules_desa ON schedules(desa_id);
CREATE INDEX idx_schedules_user_date ON schedules(user_id, visit_date);
CREATE INDEX idx_schedules_user_status ON schedules(user_id, status);

CREATE INDEX idx_visit_notes_schedule ON visit_notes(schedule_id);
CREATE INDEX idx_visit_photos_schedule ON visit_photos(schedule_id);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_excel_imports_user ON excel_imports(user_id);
CREATE INDEX idx_excel_imports_status ON excel_imports(status);
CREATE INDEX idx_excel_imports_created ON excel_imports(created_at DESC);

-- 4. TRIGGERS: AUTO-UPDATE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_kabupaten_updated_at
  BEFORE UPDATE ON kabupaten FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_kecamatan_updated_at
  BEFORE UPDATE ON kecamatan FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_desa_updated_at
  BEFORE UPDATE ON desa FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_visit_notes_updated_at
  BEFORE UPDATE ON visit_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kabupaten ENABLE ROW LEVEL SECURITY;
ALTER TABLE kecamatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_imports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Kabupaten policies
CREATE POLICY "All authenticated users can view kabupaten"
  ON kabupaten FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can manage kabupaten"
  ON kabupaten FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Kecamatan policies
CREATE POLICY "All authenticated users can view kecamatan"
  ON kecamatan FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can manage kecamatan"
  ON kecamatan FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Desa policies
CREATE POLICY "All authenticated users can view desa"
  ON desa FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can manage desa"
  ON desa FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Schedules policies
CREATE POLICY "Users can view own schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

CREATE POLICY "Admins can manage all schedules"
  ON schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Visit notes policies
CREATE POLICY "Users can view own visit notes"
  ON visit_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE id = schedule_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

CREATE POLICY "Users can manage own visit notes"
  ON visit_notes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE id = schedule_id AND user_id = auth.uid())
  );

-- Visit photos policies
CREATE POLICY "Users can view own visit photos"
  ON visit_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE id = schedule_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
  );

CREATE POLICY "Users can manage own visit photos"
  ON visit_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM schedules WHERE id = schedule_id AND user_id = auth.uid())
  );

-- Activity logs policies
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Excel imports policies
CREATE POLICY "Users can view own imports"
  ON excel_imports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own imports"
  ON excel_imports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- END OF MIGRATION
-- ============================================================
