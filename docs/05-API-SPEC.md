# API Specification

## 1. Design Philosophy

- Server Actions preferred for mutations (no REST endpoints needed)
- TanStack Query for client-side data fetching
- Supabase client-side queries for simple reads (with RLS)
- API routes for cron jobs, health/readiness checks, and server-side operations (PDF generation)

## 2. Server Actions

All mutations use Next.js Server Actions with consistent return types:

```typescript
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
```

### 2.1 Auth Actions

All auth actions require `getAuthContext()` and enforce role/kabupaten scoping server-side. `login` and `resetPassword` are rate-limited.

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `login` | Server Action | `{ email, password }` | Session |
| `logout` | Server Action | - | void |
| `resetPassword` | Server Action | `{ email }` | void |
| `updateProfile` | Server Action | `{ name, phone, avatar }` | User |

> **Rate limiting:** `login` and `resetPassword` are rate-limited (5 requests/minute per IP).

### 2.2 Master Data Actions

> **Admin-only:** all master data actions (route-guarded + hidden UI for non-admins).

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `createKabupaten` | Server Action | `{ name, code }` | Kabupaten |
| `updateKabupaten` | Server Action | `{ id, name, code }` | Kabupaten |
| `deleteKabupaten` | Server Action | `{ id }` | void |
| `createKecamatan` | Server Action | `{ name, code, kabupaten_id }` | Kecamatan |
| `updateKecamatan` | Server Action | `{ id, name, code, kabupaten_id }` | Kecamatan |
| `deleteKecamatan` | Server Action | `{ id }` | void |
| `createDesa` | Server Action | `{ name, code, kecamatan_id }` | Desa |
| `updateDesa` | Server Action | `{ id, name, code, kecamatan_id }` | Desa |
| `deleteDesa` | Server Action | `{ id }` | void |

### 2.2b User Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `createUser` | Server Action | `{ email, name, role, assigned_kabupaten_ids?, phone? }` | User |
| `updateUser` | Server Action | `{ id, name?, role?, assigned_kabupaten_ids?, phone?, is_active? }` | User |
| `deleteUser` | Server Action | `{ id }` | void |

> `assigned_kabupaten_ids` (`uuid[]`) scopes QC users to their wilayah tugas; ignored for `admin`/`produksi`.

### 2.3 Schedule Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `createSchedule` | Server Action | ScheduleInput | Schedule |
| `updateSchedule` | Server Action | `{ id, ...ScheduleInput }` | Schedule |
| `deleteSchedule` | Server Action | `{ id }` | void |
| `shiftSchedule` | Server Action | `{ id, days: 1 | -1 }` | Schedule |
| `updateVisitStatus` | Server Action | `{ id, status, latitude?, longitude? }` | Schedule |
| `bulkCreateSchedules` | Server Action | `ScheduleInput[]` | Schedule[] |

> `ScheduleInput` includes: cgr, cgr_code, block_no, no_plot, member_name, document_no, nis, tgl_tanam, ph_tanah, real_tanam_ha, gagal_tanam, sisa_di_lahan_ha, plus kabupaten/kecamatan/desa, visit_date, notes, status.
> `shiftSchedule` accepts `days` (+1 = "Geser +1 Hari", -1 = "Kembalikan -1 Hari") and applies an optimistic UI update. QC users cannot call `deleteSchedule`.

### 2.4 Visit Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `saveVisitNotes` | Server Action | `{ schedule_id, observation, problem, recommend, additional }` | VisitNotes |
| `uploadVisitPhoto` | Server Action | `{ schedule_id, file: FormDataEntryValue }` | VisitPhoto (with signed URL) |
| `deleteVisitPhoto` | Server Action | `{ id }` | void |
| `captureGpsLocation` | Server Action | `{ schedule_id, latitude, longitude, accuracy }` | void |

### 2.5 Excel Import Actions

> **Admin-only:** `importExcel` and `resetAllData` (reset before re-import) are admin-only.

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `importExcel` | Server Action | `{ file, column_mapping }` | ImportResult |
| `previewExcel` | Client-side | File | PreviewData[] |
| `resetAllData` | Server Action | - | void |

### 2.6 Notification Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `markNotificationRead` | Server Action | `{ id }` | void |
| `markAllNotificationsRead` | Server Action | - | void |
| `clearNotifications` | Server Action | - | void |

## 3. API Routes (Next.js Route Handlers)

Used only when Server Actions are insufficient (e.g., cron, health checks, file download).

### 3.1 Health & Readiness

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness check — returns `200` + `{ status, uptime }` |
| `/ready` | GET | Readiness check — pings Supabase DB; returns `200` if connected, `503` if DB unreachable |

### 3.2 Cron Jobs

> Protected by `CRON_SECRET` env var via `Authorization: Bearer <secret>` header; configured in `vercel.json`.

| Endpoint | Method | Schedule | Description |
|----------|--------|----------|-------------|
| `/api/cron/notifications` | GET | Daily 07:00 UTC (`7 0 * * *`) | Generates due-soon notifications for schedules within the next 3 days |

### 3.3 Reports

Reports use **client-side rendering** (TanStack Query + export via component), not dedicated API routes.

### 3.4 Notifications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Fetch notifications for current user (via Server Action, not REST) |
| `/api/notifications/count` | GET | Get unread notification count (used by `NotificationBell`) |

### 3.5 Rate Limiting

Rate limits are enforced via the `rate_limits` table (persistent across Vercel cold starts) with in-memory fallback.

## 4. Supabase Direct Queries

For authenticated read operations, use Supabase client directly:

### 4.1 Dashboard Queries

```typescript
// Today's schedules (count)
supabase.from('schedules')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('visit_date', today)
  .eq('status', 'pending')

// This week schedules
supabase.from('schedules')
  .select('*')
  .eq('user_id', userId)
  .gte('visit_date', startOfWeek)
  .lte('visit_date', endOfWeek)

// Late schedules
supabase.from('schedules')
  .select('*')
  .eq('user_id', userId)
  .lt('visit_date', today)
  .neq('status', 'completed')
  .neq('status', 'cancelled')

// Recent activity
supabase.from('activity_logs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)
```

### 4.2 Schedule Queries

```typescript
// List with filters
supabase.from('schedules')
  .select(`
    *,
    kabupaten: kabupaten_id (name),
    kecamatan: kecamatan_id (name),
    desa: desa_id (name)
  `)
  .eq('user_id', userId)
  .in('status', filters.status)
  .gte('visit_date', filters.startDate)
  .lte('visit_date', filters.endDate)
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('visit_date', { ascending: true })

// Search
supabase.from('schedules')
  .select(`
    *,
    kabupaten!inner (name),
    kecamatan!inner (name),
    desa!inner (name)
  `)
  .or(`kabupaten.name.ilike.%${search}%,kecamatan.name.ilike.%${search}%,desa.name.ilike.%${search}%`)
```

### 4.3 Calendar Queries

```typescript
supabase.from('schedules')
  .select('id, visit_date, status, kabupaten!inner(name)')
  .eq('user_id', userId)
  .gte('visit_date', monthStart)
  .lte('visit_date', monthEnd)
```

## 5. Error Response Format

```typescript
interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}
```

## 6. Rate Limiting

Rate limits use the `rate_limits` table (Supabase) with in-memory fallback to survive cold starts.

| Scope | Limit | Window |
|-------|-------|--------|
| Auth (`login`, `resetPassword`) | 5 requests | 1 minute per IP |
| API routes | 30 requests | 1 minute per user |
| File upload | 10 requests | 1 minute per user |
| Excel import | 3 requests | 5 minutes per user |

## 6.1 Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe: returns `200` + `{ status, uptime, timestamp }` |
| `/ready` | GET | Readiness probe: pings Supabase DB; `200` if connected, `503` if DB unreachable |

## 7. Caching Strategy

| Data Type | Cache Strategy | TTL |
|-----------|---------------|-----|
| Master Data (kabupaten/kecamatan/desa) | TanStack Query staleTime | 10 minutes |
| Schedule List | TanStack Query staleTime | 1 minute |
| Dashboard Stats | Server Component with revalidate | 30 seconds |
| User Profile | TanStack Query staleTime | 5 minutes |
| Visit Photos | Browser Cache (signed URL) | 1 hour |
| Reports | No cache (dynamic) | - |
