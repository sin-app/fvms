# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name:** Field Visit Management System (FVMS)

**Objective:** Replace manual Excel-based field visit scheduling with a centralized, mobile-first web application that enables Field Officers to manage, track, and report their field visit activities efficiently.

**Target Users:**
- Field Officers (primary)
- Supervisors (secondary)
- Administrators (system management)

## 2. Problem Statement

Field Officers currently receive monthly Excel files containing their visit schedules. This approach has several problems:

- No real-time visibility into daily schedules
- Difficult to search or filter across schedules
- No centralized history of completed visits
- Manual reporting process
- No way to document visits with photos and GPS data
- Lack of accountability and tracking
- No notifications for upcoming or late visits
- Collaboration and supervision are limited

## 3. Product Vision

To empower Field Officers with a modern, intuitive, and mobile-first platform that eliminates spreadsheets and provides a seamless experience for managing field visit operations from schedule to report.

## 4. Key Features

### Phase 1 - Core (MVP)
- Authentication (login/logout/reset password)
- Dashboard with schedule overview
- Master Data management (Kabupaten, Kecamatan, Desa)
- Excel import with column mapping
- Schedule management (CRUD, search, filter, pagination)
- Calendar view (monthly/weekly/daily)
- Visit status updates (Pending → On The Way → In Progress → Completed/Cancelled)
- Visit notes (Observation, Problem, Recommendation)
- Photo documentation upload
- GPS location capture

### Phase 2 - Enhanced
- Role-based access control (Admin, Supervisor, Field Officer)
- Supervisor dashboard and monitoring
- Reports (daily/weekly/monthly with Excel/PDF export)
- Notifications (upcoming, today, late schedules)
- Activity logs
- User management

### Phase 3 - Advanced
- Offline mode
- Push notifications
- Advanced analytics and insights
- API for third-party integration
- Multi-language support

## 5. User Roles

### Administrator
- Full system access
- Import Excel schedules
- Manage master data (Kabupaten, Kecamatan, Desa)
- Manage users
- Manage all schedules
- View all reports
- Export data

### Supervisor
- View all field officers' schedules
- Monitor field officer activities
- View statistics and dashboards
- Export reports
- Cannot modify schedules or master data

### Field Officer
- View personal schedule
- Update visit status
- Write visit notes
- Upload photo documentation
- Capture GPS location
- View visit history

## 6. Functional Requirements

### FR-01: Authentication System
- Users can login with email and password
- Users can logout
- Users can reset forgotten passwords
- Users can view and edit their profile
- Session management with Supabase Auth

### FR-02: Dashboard
- Display today's schedule count
- Display tomorrow's schedule count
- Display this week's schedule count
- Display late/uncompleted schedules
- Display completed schedule statistics
- Show recent activity timeline
- Quick action buttons for common tasks

### FR-03: Master Data Management
- CRUD operations for Kabupaten
- CRUD operations for Kecamatan (linked to Kabupaten)
- CRUD operations for Desa (linked to Kecamatan)
- Hierarchical data visualization
- Search and filter master data
- Prevent deletion of referenced data

### FR-04: Excel Import
- Upload .xlsx and .xls files
- Preview imported data before saving
- Column mapping interface (drag-and-drop or dropdown)
- Data validation with error reporting
- Duplicate detection against existing schedules
- Bulk import with progress indicator
- Import audit log

### FR-05: Schedule Management
- Full CRUD for schedules
- Search by Kabupaten, Kecamatan, Desa, date
- Filter by status, date range, region
- Paginated results
- Sortable columns
- Export filtered results

### FR-06: Calendar View
- Monthly view with visit indicators
- Weekly view for detailed planning
- Daily view for focused work
- Color-coded by status (Pending, Today, Completed, Late)
- Click to view or edit visit details

### FR-07: Visit Execution
- Change visit status with confirmation
- Capture GPS coordinates
- Write structured notes (Observation, Problem, Recommendation, Additional Notes)
- Upload multiple photos with compression
- View visit history
- Timestamp recording

### FR-08: Reports
- Daily report generation
- Weekly summary report
- Monthly comprehensive report
- Export to Excel (.xlsx)
- Export to PDF
- Filter by officer, region, date range, status

### FR-09: Notifications
- In-app notification for today's schedule
- Notification for upcoming schedules (next day)
- Warning for late/overdue schedules
- Read/unread status
- Notification center

## 7. Non-Functional Requirements

### Performance
- Page load time < 2 seconds on 3G mobile
- API response time < 500ms
- Excel import for 5000 rows < 30 seconds
- Image compression < 1 second per image

### Scalability
- Support up to 1000 concurrent users
- Handle up to 100,000 schedules per year
- Support up to 500 field officers

### Security
- HTTPS only
- Row Level Security (RLS) on all tables
- Input validation on all forms
- File upload size limit (max 10MB per photo)
- Allowed image types: JPEG, PNG, WebP
- Rate limiting on auth endpoints
- Session timeout after 24 hours

### Usability
- Mobile-first responsive design
- Touch-friendly interface (minimum 44x44px touch targets)
- Clear error messages in Bahasa Indonesia or English
- Loading states for all async operations
- Empty states with helpful guidance

### Reliability
- 99.9% uptime (Vercel SLA)
- Automatic database backups (Supabase)
- Graceful degradation when offline
- Data validation before persistence

### Accessibility
- Keyboard navigation support
- Screen reader compatible (ARIA labels)
- Sufficient color contrast (WCAG AA)
- Focus indicators visible

## 8. Constraints

- Must use Next.js 15 with App Router
- Must use Supabase for backend (DB, Auth, Storage)
- Must be deployable to Vercel
- Must be open-source (MIT license)
- Initial development within 3 months

## 9. Assumptions

- Users have stable internet connection in the field (or will have offline mode in Phase 3)
- Users have smartphones with GPS capability
- Users are familiar with basic web applications
- Excel files follow a consistent format (flexible via column mapping)

## 10. Success Metrics

- Number of active users (daily/weekly)
- Schedules completed on time (%)
- Time saved per officer (hours/week)
- User satisfaction score (> 4/5)
- Excel imports processed
- Reports generated
