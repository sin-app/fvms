# Database Design Document

## 1. Technology

PostgreSQL 15 hosted on Supabase.

## 2. Naming Conventions

- **Tables:** `snake_case` plural (e.g., `users`, `kabupaten`, `visit_notes`)
- **Columns:** `snake_case` (e.g., `created_at`, `is_active`)
- **Primary Keys:** `id` (UUID v4)
- **Foreign Keys:** `{referenced_table_singular}_id`
- **Timestamps:** `created_at`, `updated_at`
- **Soft Delete:** `deleted_at` (nullable timestamp)
- **Enums:** lowercase with underscores (e.g., `user_role`, `visit_status`)
- **Indexes:** `idx_{table}_{column}`

## 3. Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'qc', 'produksi');
CREATE TYPE visit_status AS ENUM ('pending', 'on_the_way', 'in_progress', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE import_status AS ENUM ('processing', 'completed', 'failed');
```

## 4. Table Definitions

### 4.1 users

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  role            user_role NOT NULL DEFAULT 'produksi',
  avatar_url      TEXT,
  phone           VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 4.2 kabupaten

```sql
CREATE TABLE kabupaten (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(10) NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_kabupaten_code ON kabupaten(code);
CREATE INDEX idx_kabupaten_active ON kabupaten(is_active) WHERE deleted_at IS NULL;
```

### 4.3 kecamatan

```sql
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

CREATE INDEX idx_kecamatan_kabupaten ON kecamatan(kabupaten_id);
CREATE INDEX idx_kecamatan_code ON kecamatan(code);
CREATE INDEX idx_kecamatan_active ON kecamatan(is_active) WHERE deleted_at IS NULL;
```

### 4.4 desa

```sql
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

CREATE INDEX idx_desa_kecamatan ON desa(kecamatan_id);
CREATE INDEX idx_desa_code ON desa(code);
CREATE INDEX idx_desa_active ON desa(is_active) WHERE deleted_at IS NULL;
```

### 4.5 schedules

```sql
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

CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_schedules_date ON schedules(visit_date);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_kabupaten ON schedules(kabupaten_id);
CREATE INDEX idx_schedules_kecamatan ON schedules(kecamatan_id);
CREATE INDEX idx_schedules_desa ON schedules(desa_id);
CREATE INDEX idx_schedules_user_date ON schedules(user_id, visit_date);
CREATE INDEX idx_schedules_user_status ON schedules(user_id, status);
-- Full text search index
CREATE INDEX idx_schedules_notes_fts ON schedules USING gin(to_tsvector('indonesian', COALESCE(notes, '')));
```

### 4.6 visit_notes

```sql
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

CREATE INDEX idx_visit_notes_schedule ON visit_notes(schedule_id);
```

### 4.7 visit_photos

```sql
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

CREATE INDEX idx_visit_photos_schedule ON visit_photos(schedule_id);
```

### 4.8 activity_logs

```sql
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

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```

### 4.9 notifications

```sql
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

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 4.10 excel_imports

```sql
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

CREATE INDEX idx_excel_imports_user ON excel_imports(user_id);
CREATE INDEX idx_excel_imports_status ON excel_imports(status);
CREATE INDEX idx_excel_imports_created ON excel_imports(created_at DESC);
```

## 5. Row Level Security (RLS) Policies

### 5.1 Enable RLS on all tables

```sql
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
```

### 5.2 Policies Summary

**users**
- Admin: read all, update all
- QC: read all
- Produksi: read own

**kabupaten, kecamatan, desa**
- Admin: all CRUD
- QC: read only
- Produksi: read only

**schedules**
- Admin: all CRUD
- QC: read all
- Produksi: read own, update own (limited)

**visit_notes, visit_photos**
- Admin: all CRUD
- QC: read all
- Produksi: read own, create own, update own

**activity_logs**
- Admin: read all, create
- QC: read all
- Produksi: read own

**notifications**
- Admin: create all, read all
- QC: read own
- Produksi: read own, update own (mark read)

**excel_imports**
- Admin: all CRUD
- Produksi: create, read own

## 6. Database Functions & Triggers

### 6.1 Auto-update updated_at

```sql
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
```

### 6.2 Auto-log activity

```sql
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    COALESCE(NEW.user_id, auth.uid()),
    TG_ARGV[0],
    TG_TABLE_NAME,
    NEW.id,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Backup Strategy

- Supabase automatic daily backups (Pro plan)
- Point-in-time recovery enabled
- Export weekly SQL dump to external storage
- Retention: 30 days for daily backups, 7 days for PITR
