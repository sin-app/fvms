# API Specification

## 1. Design Philosophy

- Server Actions preferred for mutations (no REST endpoints needed)
- TanStack Query for client-side data fetching
- Supabase client-side queries for simple reads (with RLS)
- API routes only for server-side operations (file processing, PDF generation)

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

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `login` | Server Action | `{ email, password }` | Session |
| `logout` | Server Action | - | void |
| `resetPassword` | Server Action | `{ email }` | void |
| `updateProfile` | Server Action | `{ name, phone, avatar }` | User |

### 2.2 Master Data Actions

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

### 2.3 Schedule Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `createSchedule` | Server Action | ScheduleInput | Schedule |
| `updateSchedule` | Server Action | `{ id, ...ScheduleInput }` | Schedule |
| `deleteSchedule` | Server Action | `{ id }` | void |
| `updateVisitStatus` | Server Action | `{ id, status, latitude?, longitude? }` | Schedule |
| `bulkCreateSchedules` | Server Action | `ScheduleInput[]` | Schedule[] |

### 2.4 Visit Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `saveVisitNotes` | Server Action | `{ schedule_id, observation, problem, recommend, additional }` | VisitNotes |
| `uploadVisitPhoto` | Server Action | `{ schedule_id, file: FormDataEntryValue }` | VisitPhoto |
| `deleteVisitPhoto` | Server Action | `{ id }` | void |
| `captureGpsLocation` | Server Action | `{ schedule_id, latitude, longitude, accuracy }` | void |

### 2.5 Excel Import Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `importExcel` | Server Action | `{ file, column_mapping }` | ImportResult |
| `previewExcel` | Client-side | File | PreviewData[] |

### 2.6 Notification Actions

| Action | Method | Input | Output |
|--------|--------|-------|--------|
| `markNotificationRead` | Server Action | `{ id }` | void |
| `markAllNotificationsRead` | Server Action | - | void |

## 3. API Routes (Next.js Route Handlers)

Used only when Server Actions are insufficient (e.g., file download).

### 3.1 Reports

| Endpoint | Method | Query Params | Response |
|----------|--------|-------------|----------|
| `/api/reports/daily` | GET | `date, user_id` | Excel/PDF |
| `/api/reports/weekly` | GET | `start_date, end_date, user_id` | Excel/PDF |
| `/api/reports/monthly` | GET | `month, year, user_id` | Excel/PDF |
| `/api/reports/export` | POST | `{ type, format, filters }` | Excel/PDF |

### 3.2 Photos

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/photos/upload` | POST | Upload photo to Supabase Storage |
| `/api/photos/delete` | DELETE | Delete photo from storage |
| `/api/photos/{id}` | GET | Serve photo with cache headers |

### 3.3 Excel

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/excel/template` | GET | Download example Excel template |

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

- Auth endpoints: 5 requests per minute per IP
- API routes: 30 requests per minute per user
- File upload: 10 requests per minute per user
- Excel import: 3 requests per 5 minutes per user

## 7. Caching Strategy

| Data Type | Cache Strategy | TTL |
|-----------|---------------|-----|
| Master Data (kabupaten/kecamatan/desa) | TanStack Query staleTime | 10 minutes |
| Schedule List | TanStack Query staleTime | 1 minute |
| Dashboard Stats | Server Component with revalidate | 30 seconds |
| User Profile | TanStack Query staleTime | 5 minutes |
| Visit Photos | Browser Cache (public) | 1 hour |
| Reports | No cache (dynamic) | - |
