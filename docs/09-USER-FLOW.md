# User Flow Documentation

## 1. Authentication Flows

### 1.1 Login Flow
```
Start → Login Page
  → Enter email & password
  → Validate (Zod)
  → Submit (Supabase Auth)
    → Success → Redirect to Dashboard
    → Error → Show error message
      → Invalid credentials → "Email atau password salah"
      → Account inactive → "Akun Anda telah dinonaktifkan"
      → Network error → "Koneksi bermasalah, coba lagi"
```

### 1.2 Password Reset Flow
```
Login Page → "Lupa Password?"
  → Enter registered email
  → Submit
    → Success → "Cek email Anda untuk instruksi reset password"
    → Error → "Email tidak terdaftar"
  → Email received → Click link → Reset Password Form
    → New password + confirm
    → Submit → Success → Redirect to Login
```

### 1.3 Logout Flow
```
Any Page → Click Profile → Logout
  → Confirm dialog "Yakin ingin keluar?"
    → Yes → Clear session → Redirect to Login
    → No → Stay on page
```

## 2. Produksi Flows

Produksi is responsible for the full field cycle: from **land application** through to **harvest** (pengajuan lahan sampai panen).

### 2.1 Daily Workflow
```
Login → Dashboard
  → View Today's Schedule
  → Tap first visit → Visit Detail
    → Update Status: "On The Way"
      → GPS capture auto?
    → Arrive at location → "In Progress"
    → Complete visit → "Completed"
      → Fill Visit Notes (Observation, Problem, Recommendation)
      → Upload Photos (optionally capture GPS)
    → Submit
  → Back to Dashboard
  → Next visit...
```

### 2.2 View Schedule Flow
```
Dashboard → Schedules
  → View list (default: this week)
  → Filter by date/status/region
  → Search by location name
  → Tap row → Visit Detail
  → Navigate to Calendar → Monthly view
  → Tap date → Day view
  → Tap event → Visit Detail
```

### 2.3 Execute Visit Flow
```
Visit Detail Page
  ┌─────────────────────────────────┐
  │ 1. View Schedule Information    │
  │    - Kabupaten, Kecamatan, Desa │
  │    - Date & Time                │
  │    - Status badge               │
  │                                 │
  │ 2. Update Status                │
  │    Pending → On The Way         │
  │    On The Way → In Progress     │
  │    In Progress → Completed      │
  │    Any → Cancelled              │
  │                                 │
  │ 3. Capture Location (GPS)       │
  │    [Capture Location] button    │
  │    Shows lat/lng/accuracy       │
  │    Map preview with marker      │
  │                                 │
  │ 4. Write Visit Notes            │
  │    Observation (textarea)       │
  │    Problem (textarea)           │
  │    Recommendation (textarea)    │
  │    Additional Notes (textarea)  │
  │                                 │
  │ 5. Upload Photos                │
  │    [Add Photo] button           │
  │    Camera or Gallery            │
  │    Auto-compressed              │
  │    Thumbnail preview grid       │
  │    Caption per photo (optional) │
  │                                 │
  │ 6. Submit / Save                │
  └─────────────────────────────────┘
```

### 2.4 History Flow
```
Dashboard → Click "Visit History"
  → List of past visits (filterable)
  → Tap visit → Read-only Visit Detail
    - All notes visible
    - Photo gallery
    - GPS location on map
    - Timeline of status changes
```

## 3. Admin Flows

### 3.1 Excel Import Flow
```
Import Page
  → Upload Excel file (drag-drop or click)
    → Validation: format, size
    → Error if invalid
  → Preview parsed data table
  → Column Mapping step
    → Auto-detect columns
    → Manual mapping (dropdown per field)
    → All required fields must be mapped
  → Preview mapped data (first 10 rows)
  → Click "Import"
    → Validation: duplicates, required fields
    → Progress bar during import
    → Result: X success, Y errors
    → Download error report if any errors
  → Done → View imported schedules
```

### 3.2 User Management Flow
```
Users Page
  → List of all users (table)
  → Search by name/email
  → Filter by role/status
  → Create User → Modal form
    → Name, Email, Role, Phone
    → System sends invite email
  → Edit User → Modal form
    → Update role, name, phone, active status
  → Deactivate User → Confirm dialog
    → User cannot login anymore
    → Their data remains intact
```

### 3.3 Master Data Management Flow
```
Master Data → Kabupaten
  → List with search
  → Create → Modal: name + code
  → Edit → Modal: update name/code
  → Delete → Confirm (restricted if in use)

Master Data → Kecamatan
  → List filtered by kabupaten
  → Create → Select kabupaten + name + code
  → Same edit/delete pattern

Master Data → Desa
  → List filtered by kecamatan (→ kabupaten)
  → Create → Select kecamatan + name + code
  → Same edit/delete pattern
```

## 4. QC Flows

QC is responsible for verification across the full field cycle: from **checking land applications** through to **harvest** (pengecekan pengajuan lahan sampai dengan panen). QC can view all Produksi schedules to perform inspection and land assessment.

### 4.1 Monitoring Flow
```
Dashboard
  → View all Produksi (field officers) stats
  → Filter/select by stage: Land Application → ... → Harvest
  → Tap officer name → Officer Detail
    → Their schedule list (all stages)
    → Their completion rate
    → Their late visits
    → Their recent activity
```

### 4.2 Report Generation Flow
```
Reports Page
  → Select report type: Daily / Weekly / Monthly
  → Set filters:
    - Date range
    - Field officer (optional)
    - Region (optional)
    - Status (optional)
  → Preview report on screen
  → Export:
    → Excel (.xlsx) download
    → PDF download
```

## 5. Error Recovery Flows

### 5.1 Failed GPS Capture
```
User clicks "Capture Location"
  → Browser requests permission
    → Denied → Show manual entry option (lat/lng)
    → Allowed → Get position
      → Success → Display coordinates
      → Error (timeout) → "Gagal mendapatkan lokasi, coba lagi"
      → Error (unavailable) → "GPS tidak tersedia"
  → User can retry or enter manually
```

### 5.2 Failed Photo Upload
```
User selects photo
  → Validate size & type
  → Compress image
  → Upload to Supabase Storage
    → Network failure → "Upload gagal, coba lagi" + retry button
    → Storage full → "Penyimpanan penuh, hubungi admin"
  → Save URL to database
    → DB error → Delete uploaded file + show error
  → Success → Show thumbnail in grid
```

### 5.3 Offline/Network Issues
```
User is in area with poor connectivity
  → App detects offline → Show offline indicator (banner)
  → Read operations: TanStack Query serves cached data
  → Write operations: Disabled with "Koneksi tidak tersedia" message
  → User waits for connection → Auto-retry on reconnect
```
