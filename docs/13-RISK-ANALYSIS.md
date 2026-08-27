# Risk Analysis

## 1. Risk Assessment Matrix

| ID | Risk | Probability | Impact | Severity | Mitigation |
|----|------|-------------|--------|----------|------------|
| R01 | Network connectivity issues in field | High | High | Critical | Offline mode (Phase 3), TanStack Query cache, retry logic |
| R02 | GPS inaccuracy in remote areas | Medium | Medium | Moderate | Allow manual coordinate entry, display accuracy level |
| R03 | Large Excel file import timeout | Medium | High | High | Chunk processing, progress indicator, 5000 row limit per batch |
| R04 | Duplicate schedule entries | Medium | Medium | Moderate | Pre-import duplicate detection, unique constraints |
| R05 | Unauthorized data access | Low | Critical | High | RLS policies, server-side validation, QC kabupaten scoping (assigned_kabupaten_ids) via canAccessSchedule()/qcKabupatenScope(), getAuthContext() gating on all server actions |
| R06 | Photo upload storage limits | Medium | Medium | Moderate | Auto-compression, file size limits, storage monitoring, photos in PRIVATE bucket via signed URLs |
| R07 | Data loss from accidental deletion | Low | Critical | Critical | Soft delete, database backups, restore procedure |
| R08 | User adoption resistance | Medium | High | High | Intuitive UI, training materials, import existing data easily |
| R09 | Browser compatibility issues | Low | Medium | Low | Target modern browsers, progressive enhancement |
| R10 | Supabase service outage | Low | Critical | Critical | Graceful degradation, caching, status page monitoring |
| R11 | Concurrent edit conflicts | Low | Medium | Low | Last-write-wins for schedules, optimistic locking for notes |
| R12 | Missing required columns in Excel | Medium | Medium | Moderate | Clear validation messages, template download, flexible mapping |

## 2. Risk Mitigation Strategies

### R01: Network Connectivity
- **Strategy:** Implement robust error handling for all network requests
- **Fallback:** TanStack Query serves cached data when offline
- **User Experience:** Show offline banner, disable write operations with clear message
- **Long-term:** Implement offline-first architecture with service workers (Phase 3)

### R02: GPS Inaccuracy
- **Strategy:** Use `enableHighAccuracy: true` in geolocation API
- **Fallback:** Allow manual input of coordinates
- **Validation:** Reject coordinates with accuracy > 100m without user confirmation
- **Display:** Show accuracy indicator next to coordinates

### R03: Excel Import Performance
- **Strategy:** Process in chunks of 500 rows
- **Limits:** Warn when file exceeds 5000 rows, suggest splitting
- **Progress:** Real-time progress bar with estimated time remaining
- **Async:** Process import asynchronously, notify user when complete

### R04: Duplicate Schedules
- **Strategy:** Check for existing schedules with same user + date + desa combination
- **UI:** Show duplicate warning during import with option to skip or overwrite
- **Database:** Unique composite index on (user_id, visit_date, desa_id) where deleted_at IS NULL

### R05: Unauthorized Access
- **Strategy:** Defense in depth
  - Row Level Security enabled on all database tables
  - Server-side validation in all Server Actions
  - Zod schema validation on all inputs
  - QC scoped to `assigned_kabupaten_ids` (wilayah tugas): `getAuthContext()` / `canAccessSchedule()` / `qcKabupatenScope()` enforce that QC can only VIEW schedules within assigned kabupaten, cannot delete schedules, and cannot delete/edit photos
  - No sensitive data in client-side state unless necessary
  - Regular RLS policy review
- **Residual risk:** Misconfigured `assigned_kabupaten_ids` could over-/under-expose schedules; requires accurate admin assignment. Admin role remains a high-value target (full access).

### R06: Storage Limits
- **Strategy:** Compress images to max 1MB before upload
- **Limits:** Max 10MB per individual upload
- **Monitoring:** Track storage usage, alert when nearing limit
- **Cleanup:** Option to delete old unused photos
- **Exposure:** Photos stored in a PRIVATE bucket and served only via signed URLs (no public access)

### R07: Data Loss
- **Strategy:** Soft delete on all master data and schedules
- **Backups:** Daily automated backups (Supabase Pro)
- **Audit:** All destructive actions logged in activity_logs
- **Recovery:** Documented restore procedure

### R08: User Adoption
- **Strategy:** Migrate from Excel with minimal friction
- **Features:** Import existing Excel files directly
- **UI:** Mobile-first, intuitive interface
- **Support:** In-app help tooltips, onboarding flow
- **Feedback:** Easy feedback submission, iterate based on usage

## 3. Technical Risks

### 3.1 Third-Party Dependency Risk
| Dependency | Risk | Fallback |
|------------|------|----------|
| Supabase | Service deprecation | PostgreSQL direct connection, self-hosted alternative |
| FullCalendar | License change | Build custom calendar with date-fns |
| shadcn/ui | Component availability | Custom components following same design system |
| Vercel | Pricing changes | Alternative deployment (Docker, Cloudflare Pages) |
| Leaflet | Map tile provider | Switch to Mapbox or Google Maps |

### 3.2 Scalability Risks
| Concern | Current Approach | Future Scaling |
|---------|-----------------|----------------|
| 100k+ schedules | Indexed queries, pagination | Read replicas, partitioning by date |
| 500+ users | RLS policies | Connection pooling, PgBouncer |
| 10k+ photos/month | Supabase Storage | CDN caching, S3-compatible storage |
| Concurrent imports | Sequential processing | Queue system (Redis/Bull) |

## 4. Security Risks

### 4.1 Authentication
- **Risk:** Brute force attacks
- **Mitigation:** Rate limiting on login & reset-password endpoints, Supabase Auth built-in protection
- **Residual risk:** Rate limiting is IP/account-based; distributed attacks from many IPs remain partially mitigated only by Supabase Auth protections.

### 4.2 Data in Transit
- **Risk:** Man-in-the-middle attacks
- **Mitigation:** HTTPS enforced, HSTS headers, secure cookie flags

### 4.3 File Upload
- **Risk:** Malicious file upload
- **Mitigation:** Validate MIME type, check magic bytes, limit file size, scan for malware

### 4.4 SQL Injection
- **Risk:** Via compromised client
- **Mitigation:** Supabase client parameterized queries, no raw SQL in client code

## 5. Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low user adoption | Project failure | Involve users early, iterate on feedback |
| Scope creep | Delayed release | Strict MVP scope, prioritize features |
| Budget overrun | Project cancellation | Open-source, free tier of Supabase + Vercel |
| Key developer leaves | Knowledge loss | Documentation, code reviews, pair programming |
| Data privacy regulations | Legal issues | GDPR compliance, data anonymization, consent |

## 6. Monitoring & Alerting

| What | How | Alert When |
|------|-----|------------|
| App errors | Vercel Analytics + console.error | Error rate > 1% |
| API latency | Vercel Speed Insights | P95 > 2s |
| Auth failures | Supabase Auth logs | > 10 failed attempts/minute/IP |
| Storage usage | Supabase Dashboard | > 80% of plan limit |
| Database size | Supabase Database | > 1GB growth/week |
| Uptime | Vercel Status | Any downtime detected |
