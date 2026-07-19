# Development Roadmap

## Phase 0: Foundation (Week 1)

### Objectives
- Set up project scaffold
- Configure development environment
- Create Supabase project
- Initialize database schema
- Set up CI/CD pipeline

### Tasks
- [ ] Initialize Next.js 16 project with TypeScript
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up Supabase project (DB, Auth, Storage)
- [ ] Create database migrations (all tables, RLS, indexes)
- [ ] Set up ESLint, Prettier, Husky
- [ ] Configure environment variables
- [ ] Set up GitHub repository
- [ ] Deploy initial scaffold to Vercel
- [ ] Set up CI/CD with GitHub Actions

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
- [ ] Configure Supabase Auth
- [ ] Build Login page and form
- [ ] Build Password Reset flow
- [ ] Create auth middleware
- [ ] Build Profile page
- [ ] Implement session management
- [ ] Create auth layout (unauthenticated)

### Deliverables
- Working authentication
- Protected routes
- User can login/logout/reset password

---

## Phase 2: Master Data (Week 3)

### Objectives
- CRUD for Kabupaten, Kecamatan, Desa
- Hierarchical data management
- Responsive tables with search

### Tasks
- [ ] Build Kabupaten management (list, create, edit, delete)
- [ ] Build Kecamatan management (filtered by Kabupaten)
- [ ] Build Desa management (filtered by Kecamatan)
- [ ] Create reusable RegionSelector component
- [ ] Implement soft delete
- [ ] Add search and pagination

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
- [ ] Build ScheduleTable with TanStack Table
- [ ] Build ScheduleForm (create/edit)
- [ ] Build ScheduleFilters
- [ ] Implement search with debounce
- [ ] Implement pagination
- [ ] Build CalendarView with FullCalendar
- [ ] Build Schedule detail page
- [ ] Add cascading region selects

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
- [ ] Build VisitStatusSelector with state machine
- [ ] Build VisitNotesForm
- [ ] Build VisitPhotos component with upload
- [ ] Implement image compression (browser-side)
- [ ] Build VisitGps component
- [ ] Integrate Leaflet map
- [ ] Build VisitTimeline component
- [ ] Create visit detail page

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
- [ ] Build FileUploader (drag-drop)
- [ ] Build ColumnMapping component
- [ ] Build PreviewTable
- [ ] Implement SheetJS parsing
- [ ] Build ValidationReport
- [ ] Implement bulk insert
- [ ] Add import history
- [ ] Error report download

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
- [ ] Build ReportFilters component
- [ ] Build ReportTable component
- [ ] Implement Excel export (SheetJS)
- [ ] Implement PDF export
- [ ] Build report preview
- [ ] Add charts (completion rate, etc.)

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
- [ ] Build NotificationBell component
- [ ] Build NotificationList component
- [ ] Implement notification generation (triggers)
- [ ] Schedule notification checks (cron)
- [ ] Mark as read functionality
- [ ] Notification center page

### Deliverables
- In-app notification system
- Automated schedule reminders

---

## Phase 9: User Management (Week 11)

### Objectives
- Admin user CRUD
- Role management
- Account activation/deactivation

### Tasks
- [ ] Build UsersTable
- [ ] Build UserForm (create/edit)
- [ ] Implement role assignment
- [ ] Account activation toggle
- [ ] Invite new users via email

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
- [ ] Write unit tests (Vitest)
- [ ] Write integration tests
- [ ] Write E2E tests (Playwright)
- [ ] Performance profiling
- [ ] Accessibility audit (WCAG AA)
- [ ] Mobile testing on real devices
- [ ] Load testing
- [ ] Security audit
- [ ] Bug fixes

### Deliverables
- Test coverage > 80%
- Performance optimized
- Accessibility compliant
- Production-ready

---

## Summary Timeline

| Week | Phase | Milestone |
|------|-------|-----------|
| 1 | Foundation | Project scaffold deployed |
| 2 | Auth | Login/logout working |
| 3 | Master Data | Region management |
| 4 | Dashboard | Dashboard with live data |
| 5-6 | Schedule | Full schedule management |
| 7-8 | Visit | Visit execution complete |
| 9 | Import | Excel import working |
| 10 | Reports | Report generation |
| 11 | Notifications + Users | Notifications + User mgmt |
| 12 | Polish | Production-ready |
