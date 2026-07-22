# Development Roadmap

## Phase 0: Foundation (Week 1)

### Objectives
- Set up project scaffold
- Configure development environment
- Create Supabase project
- Initialize database schema
- Set up CI/CD pipeline

### Tasks
- [x] Initialize Next.js 16 project with TypeScript
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up Supabase project (DB, Auth, Storage)
- [x] Create database migrations (all tables, RLS, indexes)
- [x] Set up ESLint, Prettier, Husky
- [x] Configure environment variables
- [x] Set up GitHub repository
- [x] Deploy initial scaffold to Vercel (https://fvms-eight.vercel.app)
- [x] Set up CI/CD with GitHub Actions

### Deliverables
- Working Next.js app deployed on Vercel
- Supabase project with database schema
- Development tooling configured
- Documentation in /docs

---

## Phase 1: Core Authentication (Week 2)

### Objectives
- Implement authentication system
- Create login, logout, password reset
- Set up middleware for route protection
- Create user profile page

### Tasks
- [x] Configure Supabase Auth
- [x] Build Login page and form
- [x] Build Password Reset flow
- [x] Create auth middleware (src/proxy.ts for Next.js 16)
- [x] Build Profile page
- [x] Implement session management
- [x] Create auth layout (unauthenticated)
- [x] Rate-limit login & reset-password endpoints

### Deliverables
- Working authentication
- Protected routes
- User can login/logout/reset password

---

## Phase 2: Master Data (Week 3)

### Objectives
- CRUD for Kabupaten, Kecamatan, Desa (ADMIN-ONLY)
- Hierarchical data management
- Responsive tables with search

### Tasks
- [x] Build Kabupaten management (list, create, edit, delete) — admin only
- [x] Build Kecamatan management (filtered by Kabupaten) — admin only
- [x] Build Desa management (filtered by Kecamatan) — admin only
- [x] Create reusable RegionSelector component
- [x] Implement soft delete
- [x] Add search and pagination

### Deliverables
- Fully functional master data module
- Hierarchical region management

---

## Phase 3: Dashboard (Week 4)

### Objectives
- Build main dashboard
- Statistics cards
- Today's schedule list
- Recent activity timeline

### Tasks
- [ ] Build StatsCards component
- [ ] Build TodaySchedule component
- [ ] Build UpcomingSchedule component
- [ ] Build RecentActivity component
- [ ] Create dashboard layout
- [ ] Add quick action buttons
- [ ] Connect to real data

### Deliverables
- Working dashboard with live data
- Quick overview of schedules

---

## Phase 4: Schedule Management (Week 5-6)

### Objectives
- Full CRUD for schedules
- Search, filter, sort, pagination
- Calendar view (monthly/weekly/daily)
- Schedule detail page

### Tasks
- [x] Build ScheduleTable with TanStack Table
- [x] Build ScheduleForm (create/edit) with full fields (CGR, CGR Code, Block No, No Plot, Member Name, Document No, NIS, Tgl Tanam, PH Tanah, Real Tanam HA, Gagal Tanam, Sisa di Lahan HA)
- [x] Build ScheduleFilters
- [x] Implement search with debounce
- [x] Implement pagination
- [x] Build CalendarView with FullCalendar
- [x] Build Schedule detail page
- [x] Add cascading region selects
- [x] Add instant "Geser +1 Hari" / "Kembalikan -1 Hari" schedule shift buttons

### Deliverables
- Complete schedule management
- Interactive calendar
- Fast search and filtering

---

## Phase 5: Visit Execution (Week 7-8)

### Objectives
- Status management
- Visit notes
- Photo upload
- GPS capture

### Tasks
- [x] Build VisitStatusSelector with state machine
- [x] Build VisitNotesForm
- [x] Build VisitPhotos component with upload (QC: upload/capture GPS allowed; delete/edit photos restricted)
- [x] Implement image compression (browser-side)
- [x] Build VisitGps component
- [x] Integrate Leaflet map
- [x] Build VisitTimeline component
- [x] Create visit detail page
- [x] Store photos in PRIVATE bucket served via signed URLs

### Deliverables
- Complete visit execution flow
- Photo documentation with upload
- GPS location tracking

---

## Phase 6: Excel Import (Week 9)

### Objectives
- File upload with preview
- Column mapping with auto-detect
- Validation and duplicate detection
- Bulk import

### Tasks
- [x] Build FileUploader (drag-drop) — admin only
- [x] Build ColumnMapping component
- [x] Build PreviewTable
- [x] Implement SheetJS parsing
- [x] Build ValidationReport
- [x] Implement bulk insert
- [x] Add import history
- [x] Error report download
- [x] resetAllData is admin-only

### Deliverables
- Working Excel import flow
- Column mapping UI
- Error handling and reporting

---

## Phase 7: Reports (Week 10)

### Objectives
- Daily/weekly/monthly reports
- Excel and PDF export
- Filter by officer, region, date

### Tasks
- [x] Build ReportFilters component
- [x] Build ReportTable component
- [x] Implement Excel export (SheetJS)
- [x] Implement PDF export
- [x] Build report preview
- [x] Add charts (completion rate, etc.)

### Deliverables
- Working report generation
- Export to Excel and PDF

---

## Phase 8: Notifications (Week 11)

### Objectives
- In-app notifications
- Schedule reminders
- Late visit warnings

### Tasks
- [x] Build NotificationBell component
- [x] Build NotificationList component
- [x] Implement notification generation (triggers)
- [x] Schedule notification checks (cron)
- [x] Mark as read functionality
- [x] Notification center page

### Deliverables
- In-app notification system
- Automated schedule reminders

---

## Phase 9: User Management (Week 11)

### Objectives
- Admin user CRUD
- Role management (admin / qc / produksi)
- Account activation/deactivation

### Tasks
- [x] Build UsersTable
- [x] Build UserForm (create/edit)
- [x] Implement role assignment
- [x] Account activation toggle
- [x] Invite new users via email
- [x] QC scoped to assigned_kabupaten_ids (wilayah tugas): view schedules only within assigned kabupaten, upload photos & capture GPS in field, cannot delete/edit photos or delete schedules

### Deliverables
- User management for admins
- Role-based access control

---

## Phase 10: Polish & Testing (Week 12)

### Objectives
- Comprehensive testing
- Performance optimization
- Accessibility audit
- Bug fixes

### Tasks
- [x] Write unit tests (Vitest) — 59+ tests passing
- [x] Write integration tests (Vitest + MSW)
- [x] Write E2E tests (Playwright) — auth, schedules, reports, notifications, master-data
- [x] Performance profiling
- [x] Accessibility audit (WCAG AA)
- [x] Mobile testing on real devices
- [x] Load testing
- [x] Security hardening:
  - [x] RLS enabled on all tables
  - [x] Server actions gated by getAuthContext() / canAccessSchedule() / qcKabupatenScope()
  - [x] CSP + security headers in next.config.ts
  - [x] Login & reset-password rate limiting
  - [x] Photos in PRIVATE bucket via signed URLs
  - [x] Structured JSON logger (src/lib/logger.ts)
  - [x] /health endpoint
- [x] Bug fixes

### Deliverables
- Test coverage > 80%
- Performance optimized
- Accessibility compliant
- Production-ready

---

## Summary Timeline

| Week | Phase | Milestone |
|------|-------|-----------|
| 1 | Foundation | Project scaffold deployed → https://fvms-eight.vercel.app |
| 2 | Auth | Login/logout working, rate-limited |
| 3 | Master Data | Region management (admin-only) |
| 4 | Dashboard | Dashboard with live data |
| 5-6 | Schedule | Full schedule management, +1/-1 day shift, full field set |
| 7-8 | Visit | Visit execution complete, private photo bucket |
| 9 | Import | Excel import working (admin-only) |
| 10 | Reports | Report generation, Excel & PDF export, charts |
| 11 | Notifications + Users | Notifications (in-app, cron, Realtime), User mgmt, QC kabupaten scoping |
| 12 | Polish | Production-ready, security hardened, 59+ tests |
