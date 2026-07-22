# Task Breakdown

## Phase 0: Foundation

### Task 0.1: Initialize Next.js Project
```bash
npx create-next-app@latest fvms --typescript --tailwind --eslint --app --src-dir
cd fvms
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu input label select table badge avatar toast separator tabs sheet
npm install @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod
npm install @supabase/supabase-js @supabase/ssr
npm install date-fns clsx tailwind-merge lucide-react
npm install xlsx @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install leaflet react-leaflet @types/leaflet
npm install browser-image-compression
npm install recharts
npm install -D vitest @testing-library/react @testing-library/jest-dom msw
```

### Task 0.2: Configure Project
- Set up `tsconfig.json` with strict mode
- Configure `tailwind.config.ts` with custom theme
- Set up `.env.example` and `.env.local`
- Configure `src/proxy.ts` for auth (Next.js 16; NOT middleware.ts)
- Create Supabase client files

### Task 0.3: Database Migration
- Write SQL migration for all tables
- Enable RLS on all tables
- Create RLS policies
- Create triggers and functions
- Seed initial data (admin user, some regions)

### Task 0.4: CI/CD Setup
- GitHub repository
- GitHub Actions workflow (lint, typecheck, test, build)
- Vercel project connection
- Husky pre-commit hooks

---

## Phase 1: Authentication

### Task 1.1: Supabase Auth Configuration
- Configure auth providers (email/password)
- Set up redirect URLs
- Configure email templates

### Task 1.2: Auth Utilities
```typescript
// src/lib/supabase/client.ts - Browser client
// src/lib/supabase/server-client.ts - Server component client
// src/lib/supabase/admin-client.ts - Service role client (admin only)
```

### Task 1.3: Login Page
- Create `src/app/(auth)/login/page.tsx`
- Create `src/features/auth/components/login-form.tsx`
- Create `src/features/auth/schema/auth-schema.ts` (Zod schema)
- Create `src/features/auth/types/index.ts`
- Create `src/features/auth/hooks/use-auth.ts`
- Create `src/features/auth/api/auth-client.ts`

### Task 1.4: Password Reset Flow
- Create reset password page
- Email confirmation handling
- New password form

### Task 1.5: Auth Middleware
- Create `src/proxy.ts` (Next.js 16 middleware replacement; NOT middleware.ts)
- Route protection logic
- Redirect unauthenticated users to login
- Redirect authenticated users away from login
- Rate-limit login & reset-password endpoints [DONE]

### Task 1.6: Profile Page
- View profile information
- Edit profile (name, phone, avatar)

---

## Phase 2: Master Data

### Task 2.1: Types & Validation
- Create `src/features/master-data/types/index.ts`
- Create `src/features/master-data/schema/master-data-schema.ts`
- Create shared types in `src/types/database.ts`

### Task 2.2: Services
- Create `src/features/master-data/services/master-data-service.ts`
- Server Actions for CRUD

### Task 2.3: API Clients
- `src/features/master-data/api/kabupaten-client.ts`
- `src/features/master-data/api/kecamatan-client.ts`
- `src/features/master-data/api/desa-client.ts`

### Task 2.4: Hooks
- `src/features/master-data/hooks/use-kabupaten.ts`
- `src/features/master-data/hooks/use-kecamatan.ts`
- `src/features/master-data/hooks/use-desa.ts`

### Task 2.5: Components
- `src/features/master-data/components/kabupaten-table.tsx`
- `src/features/master-data/components/kabupaten-form.tsx`
- `src/features/master-data/components/kecamatan-table.tsx`
- `src/features/master-data/components/kecamatan-form.tsx`
- `src/features/master-data/components/desa-table.tsx`
- `src/features/master-data/components/desa-form.tsx`
- `src/features/master-data/components/region-selector.tsx`

### Task 2.6: Pages
- `src/app/(dashboard)/master-data/kabupaten/page.tsx`
- `src/app/(dashboard)/master-data/kecamatan/page.tsx`
- `src/app/(dashboard)/master-data/desa/page.tsx`
- **Admin-only** master data [DONE]

---

## Phase 3: Dashboard

### Task 3.1: Types
- `src/features/dashboard/types/index.ts`

### Task 3.2: API & Services
- `src/features/dashboard/api/dashboard-client.ts`
- Server Actions for dashboard data

### Task 3.3: Hooks
- `src/features/dashboard/hooks/use-dashboard.ts`

### Task 3.4: Components
- `src/features/dashboard/components/stats-cards.tsx`
- `src/features/dashboard/components/today-schedule.tsx`
- `src/features/dashboard/components/upcoming-schedule.tsx`
- `src/features/dashboard/components/recent-activity.tsx`
- `src/features/dashboard/components/quick-actions.tsx`

### Task 3.5: Page
- `src/app/(dashboard)/dashboard/page.tsx`
- Dashboard layout composition

---

## Phase 4: Schedule Management

### Task 4.1: Types & Validation
- Schedule types with relationships
- Zod schemas for create/update
- Query parameter types for filtering

### Task 4.2: Services
- Schedule service with CRUD
- Search with full-text search
- Filtering and pagination logic

### Task 4.3: API Clients
- TanStack Query hooks
- Optimistic updates for status changes

### Task 4.4: Components
- ScheduleTable with TanStack Table
- ScheduleForm with cascading selects — full fields: CGR, CGR Code, Block No, No Plot, Member Name, Document No, NIS, Tgl Tanam, PH Tanah, Real Tanam HA, Gagal Tanam, Sisa di Lahan HA
- ScheduleFilters with all filter options
- ScheduleActions (edit, delete, view)
- CalendarView with FullCalendar
- Instant "Geser +1 Hari" / "Kembalikan -1 Hari" shift buttons [DONE]

### Task 4.5: Pages
- Schedule list page
- Schedule detail page
- Calendar page

---

## Phase 5: Visit Execution

### Task 5.1: Types & Validation
- Visit status enumerations
- Notes schema with rich text
- Photo metadata types
- GPS coordinate types

### Task 5.2: Services
- Status transition validation
- Image compression utility
- Supabase Storage integration
- GPS capture service

### Task 5.3: Components
- VisitStatusSelector
- VisitNotesForm
- VisitPhotos (upload, grid; QC can upload/capture GPS but NOT delete/edit; photos in PRIVATE bucket via signed URLs) [DONE]
- VisitGps with Leaflet map
- VisitTimeline

### Task 5.4: API Routes
- Photo upload endpoint
- Photo deletion endpoint

### Task 5.5: Page
- Visit detail page (full execution interface)

---

## Phase 6: Excel Import

### Task 6.1: Types & Validation
- Excel row types
- Column mapping types
- Import result types

### Task 6.2: Services
- SheetJS parsing service
- Column auto-detection logic
- Duplicate detection
- Bulk insert with validation

### Task 6.3: Components
- FileUploader with drag-drop
- ColumnMapping with dropdowns
- PreviewTable
- ValidationReport with errors
- ImportProgress with status

### Task 6.4: Page
- Import page with wizard steps — **admin-only**; `resetAllData` admin-only [DONE]

---

## Phase 7: Reports

### Task 7.1: Types
- Report filter types
- Report data types
- Export format types

### Task 7.2: Services
- Report data aggregation
- Excel generation (SheetJS)
- PDF generation

### Task 7.3: API Routes
- Daily report endpoint
- Weekly report endpoint
- Monthly report endpoint
- Export endpoint

### Task 7.4: Components
- ReportFilters
- ReportTable
- ReportChart (Recharts)
- ExportButtons

### Task 7.5: Page
- Reports page

---

## Phase 8: Notifications

### Task 8.1: Types
- Notification types
- Notification preferences

### Task 8.2: Services & Triggers
- Database function for notification generation
- Daily cron check for schedules
- Late schedule detection

### Task 8.3: Components
- NotificationBell (header)
- NotificationList
- NotificationItem

### Task 8.4: Page
- Notifications center page

---

## Phase 9: User Management

### Task 9.1: Types & Validation
- User types with role
- User create/update schemas

### Task 9.2: Services
- User CRUD (admin only)
- Invitation email
- Role management

### Task 9.3: Components
- UsersTable
- UserForm

### Task 9.4: Page
- Users management page (admin)

### Task 9.5: QC Kabupaten Scoping [DONE]
- QC scoped to `assigned_kabupaten_ids` (wilayah tugas)
- view schedules only within assigned kabupaten
- upload photos & capture GPS in field
- cannot delete/edit photos or delete schedules

---

## Phase 10: Polish

### Task 10.1: Unit Testing
- Test all services
- Test all hooks
- Test utility functions
- **Status: 54 vitest tests passing** [DONE]

### Task 10.2: Integration Testing
- Test all Server Actions
- Test API routes
- Service-layer mocking + MSW for integration [DONE]

### Task 10.3: E2E Testing
- Login flow
- CRUD flows
- Import flow
- Visit execution flow
- (Not yet implemented)

### Task 10.4: Performance
- Lighthouse audit
- Image optimization
- Bundle size analysis
- API response time optimization [DONE]

### Task 10.5: Accessibility
- WCAG AA compliance check
- Keyboard navigation testing
- Screen reader testing
- Color contrast verification [DONE]

### Task 10.6: Bug Fixes
- Address all identified issues
- Edge case handling
- Error boundary improvement [DONE]

### Task 10.7: Security Hardening [DONE]
- RLS enabled on all tables
- Server actions gated by getAuthContext() / canAccessSchedule() / qcKabupatenScope()
- CSP + security headers in next.config.ts
- Rate-limited login & reset-password
- Private storage bucket + signed URLs
- Structured JSON logger (src/lib/logger.ts)
- /health endpoint
