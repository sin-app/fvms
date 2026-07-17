# Components Documentation

## 1. Component Architecture

### Component Categories

1. **UI Primitives** (`components/ui/`) - shadcn/ui generated components
2. **Shared Components** (`components/shared/`) - App-wide reusable components
3. **Feature Components** (`features/*/components/`) - Feature-specific components
4. **Page Components** (`app/*/page.tsx`) - Page-level composition

### Rules
- UI primitives are generic and app-agnostic
- Shared components use UI primitives and app types
- Feature components use shared components and feature types
- Page components compose feature components

## 2. UI Primitives (shadcn/ui)

Standard shadcn/ui components configured with FVMS theme:

- Button, Input, Label, Select, Textarea
- Card, CardHeader, CardContent, CardFooter
- Dialog, DialogTrigger, DialogContent, DialogHeader
- DropdownMenu, DropdownMenuItem
- Table, TableHeader, TableBody, TableRow, TableCell
- Badge, Avatar, AvatarImage, AvatarFallback
- Toast, Toaster
- Separator, Tabs, TabsContent, TabsList, TabsTrigger
- Sheet, SheetContent, SheetTrigger (for mobile bottom nav menus)
- Calendar, Popover, Command (for date pickers and comboboxes)

## 3. Shared Components

### AppSidebar
```typescript
// Desktop sidebar navigation
// Props: { user: User }
// State: collapsed/expanded, active route
// Renders: logo, nav items, user info at bottom
```

### AppHeader
```typescript
// Top navigation bar
// Props: { title: string, user: User }
// Renders: mobile back button, title, notification bell, avatar
```

### BottomNav
```typescript
// Mobile bottom navigation
// Props: { activeRoute: string }
// Renders: 5 icon tabs with labels
```

### DataTable
```typescript
// Generic data table with TanStack Table
// Props: {
//   columns: ColumnDef<T>[],
//   data: T[],
//   pageCount?: number,
//   onPagination?: (state) => void,
//   onSorting?: (state) => void,
//   loading?: boolean,
//   emptyMessage?: string,
// }
// Features: sorting, pagination, selection, loading state, empty state
```

### PageHeader
```typescript
// Page title + action area
// Props: {
//   title: string,
//   description?: string,
//   actions?: ReactNode,
//   backButton?: boolean,
// }
```

### SearchInput
```typescript
// Search with debounce
// Props: { value: string, onChange: (value) => void, placeholder?: string }
// Features: debounce 300ms, clear button, search icon
```

### StatusBadge
```typescript
// Colored status indicator
// Props: { status: VisitStatus, size?: 'sm' | 'md' }
// Renders: colored dot + localized status text
```

### EmptyState
```typescript
// Empty state placeholder
// Props: {
//   icon?: ReactNode,
//   title: string,
//   description: string,
//   action?: { label: string, onClick: () => void },
// }
```

### LoadingState
```typescript
// Loading skeleton
// Props: { variant: 'card' | 'table' | 'list', count?: number }
```

### ErrorState
```typescript
// Error state with retry
// Props: { error: Error, onRetry?: () => void, message?: string }
```

### ConfirmDialog
```typescript
// Confirmation dialog
// Props: {
//   open: boolean,
//   onOpenChange: (open) => void,
//   title: string,
//   message: string,
//   confirmLabel?: string,
//   variant?: 'default' | 'destructive',
//   onConfirm: () => void,
//   loading?: boolean,
// }
```

### StatCard
```typescript
// Dashboard statistic card
// Props: {
//   title: string,
//   value: string | number,
//   icon?: ReactNode,
//   trend?: { value: number, positive: boolean },
//   href?: string,
// }
```

### DateRangePicker
```typescript
// Date range selector
// Props: { value: [Date, Date], onChange: (range) => void }
// Uses: shadcn Calendar + Popover
```

### FileUpload
```typescript
// File upload with drag and drop
// Props: {
//   accept: string,
//   maxSize: number,        // MB
//   multiple: boolean,
//   onUpload: (files) => void,
//   preview?: boolean,
// }
// Features: drag-drop zone, file validation, progress, preview
```

## 4. Feature Components

### 4.1 Auth

**LoginForm**
```typescript
// Email + password login form
// State: loading, error
// Validation: Zod schema (email format, password min 6)
// On success: redirect to dashboard
```

**ResetPasswordForm**
```typescript
// Email input for password reset
// State: loading, sent, error
// On success: "Check your email" message
```

**ProfileForm**
```typescript
// Edit user profile
// Fields: name, phone, avatar
// Validation: Zod schema
```

### 4.2 Dashboard

**StatsCards**
```typescript
// 4-6 stat cards in grid
// Data: today, tomorrow, week, late, completed counts
```

**TodaySchedule**
```typescript
// Today's schedule list (compact)
// Each item: time, kabupaten, kecamatan, status badge
// Click: navigate to visit detail
```

**UpcomingSchedule**
```typescript
// Next 5 upcoming schedules
// Same format as today schedule
```

**RecentActivity**
```typescript
// Timeline of recent activity (max 10)
// Each item: icon, action text, timestamp
```

### 4.3 Master Data

**KabupatenTable, KecamatanTable, DesaTable**
```typescript
// Data table with CRUD actions
// Columns: name, code, status, created_at, actions
// Each row: edit button, delete button (with confirm)
```

**KabupatenForm, KecamatanForm, DesaForm**
```typescript
// Modal form for create/edit
// Fields: name (required), code (required, unique), is_active
// Kecamatan adds: kabupaten select
// Desa adds: kecamatan select (filtered by kabupaten)
```

### 4.4 Schedules

**ScheduleTable**
```typescript
// Full schedule list with TanStack Table
// Columns: date, kabupaten, kecamatan, desa, status, actions
// Features: search, filter, sort, pagination
```

**ScheduleForm**
```typescript
// Create/edit schedule form
// Fields: user, kabupaten, kecamatan, desa, visit_date, notes
// Cascading selects: kabupaten → kecamatan → desa
```

**ScheduleFilters**
```typescript
// Filter bar for schedule list
// Filters: kabupaten, kecamatan, desa, date range, status
// Clear all button
```

**CalendarView**
```typescript
// FullCalendar integration
// Views: month, week, day
// Events: colored dots by status
// Click: navigate to schedule detail
```

### 4.5 Visits

**VisitStatusSelector**
```typescript
// Status change widget
// Shows: current status, all available transitions
// On change: confirm dialog, then update
// Available transitions based on current status
```

**VisitNotesForm**
```typescript
// Structured notes form
// Sections: Observation, Problem, Recommendation, Additional
// Each: textarea with character count
```

**VisitPhotos**
```typescript
// Photo gallery + upload
// Grid of existing photos
// Upload button → camera/gallery
// Auto-compress before upload
// Delete photo (with confirm)
```

**VisitGps**
```typescript
// GPS capture component
// "Capture Location" button
// Shows: current lat/lng, accuracy, timestamp
// Map preview with marker
// Recapture button
```

### 4.6 Excel Import

**FileUploader**
```typescript
// Excel file drag-drop zone
// Accept: .xlsx, .xls
// Max size: 10MB
// Shows: filename, size, remove button
```

**ColumnMapping**
```typescript
// Map Excel columns to system fields
// For each required field: dropdown of Excel columns
// Auto-detect matching columns
// Validation: all required fields must be mapped
```

**PreviewTable**
```typescript
// Preview imported data before save
// First 10 rows of parsed data
// Highlight issues
// Column headers from mapping
```

**ValidationReport**
```typescript
// Import validation results
// Success count, error count
// List of errors with row number and description
// Download error report option
```

### 4.7 Notifications

**NotificationList**
```typescript
// List of all notifications
// Grouped by date
// Each item: icon (by type), title, message, time, read/unread
// Click: mark as read + navigate to related page
```

**NotificationBell**
```typescript
// Header notification indicator
// Icon with unread count badge
// Click: open notification dropdown/panel
```

## 5. Component States

Every interactive component must handle:

| State | Visual |
|-------|--------|
| **Default** | Normal appearance |
| **Loading** | Skeleton or spinner |
| **Empty** | EmptyState component |
| **Error** | ErrorState with retry |
| **Success** | Brief success feedback |
| **Disabled** | Reduced opacity, no interaction |
| **Focus** | Ring indicator |
| **Active/Pressed** | Scale or color change |
| **Hover** | Background color change (desktop only) |
