# FVMS - Field Visit Management System

## UI/UX Direction (Mobile-first Futuristic)
- **Arah visual B**: latar netral terang/gelap mengikuti preferensi sistem (`dark:` variant, bukan force-dark) + **aksen hijau emerald** sebagai warna brand; warna status tetap dipertahankan.
- **Token brand** (di `src/app/globals.css`): `--brand`, `--brand-strong`, `--brand-soft`, `--brand-foreground` (map ke `bg-brand`, `text-brand`, `bg-brand-soft`, dll). Utility: `bg-brand-gradient` (latar gradien emerald), `text-gradient-brand`, `shadow-brand-glow` (glow lembut), `.shimmer` (skeleton loading), animasi `animate-fade-in-up` / `animate-scale-in` (`--animate-*` keyframes di `@theme inline`).
- **Reduced motion**: global `@media (prefers-reduced-motion: reduce)` mematikan animasi/transisi/scroll — jangan bypass.
- **Navigasi mobile**: `BottomNav` = bottom navigation **floating pill** fixed, 5 tab tetap (Home, Jadwal, Kalender, Laporan, Profil), tidak menampilkan item admin — link admin (Master Data, Import, Users) tersedia di halaman `/profile`. Safe-area: `pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]`. Layout utama memberi ruang `pb-36 md:pb-8` untuk nav ini.
- **Tablet/desktop**: `AppSidebar` (`hidden md:flex`); item aktif = `bg-brand-soft text-brand`. Header (`AppHeader`) sticky + blur; judul halaman hanya tampil di `sm+`, avatar inisial user tampil di mobile.
- **Daftar jadwal (Schedules)**: tabel `hidden md:block` (horizontal scroll), mobile menggunakan **card view** (`md:hidden`, `schedule-table.tsx`) — grup per tanggal, checkbox/status/label, info ringkas, aksi (lihat/edit/hapus/geser ±1). Kedua view dirender bersamaan (CSS-switch, bukan JS `useMediaQuery`) agar aman SSR/hydration; logika & handler dibagikan.
- **Dashboard**: hero sapaan (`DashboardHero` di `dashboard/page.tsx`, `bg-brand-gradient`, tanggal id-ID) + `StatsCards` = horizontal snap-scroll di mobile (`snap-x snap-mandatory`, `no-scrollbar`, item `w-44 sm:w-56`, `md:contents` di grid) → grid 3/4 kolom di `md+`.
- **Touch target**: tombol ikon minimal `h-10 w-10` (48px), tombol teks `min-h-11` di area kritis; focusable punya `focus-visible` ring jelas.
- **Loading**: gunakan `LoadingState` (skeleton `.shimmer`, `role="status"` + sr-only); jangan pakai `animate-pulse` baru. Error: `ErrorState` (`role="alert"`). Empty: `EmptyState`.

## Offline-first (Fase 2 — fondasi)
- **Store lokal**: Dexie/IndexedDB `src/lib/offline/db.ts` (`fvms-offline`, v1): tabel `schedules` (join denormalisasi `*_name`), `visitNotes` (pk `schedule_id`), `visitPhotos` (+ blob lokal utk foto belum upload), `regions` (kab/kec/desa, key `entity:id`), `outbox` (antrian mutasi idempotent: `table/action/entity_id/payload`), `meta` (watermark `watermark:<table>:<userId>`, `last_sync_at`).
- **Engine**: `src/lib/offline/engine.ts` — `hydrateOffline()` (pull scoped peran: produksi `eq user_id`, qc `in kabupaten_id` via `syncUserContext()`, admin semua; replace-all per tabel; watermark), `pushOutbox()` (replay urut; visit_notes `upsert onConflict schedule_id`; foto = upload storage `{uid}/visits/{sid}/{uuid}.ext` dulu, baru upsert row `onConflict id`; schedules = `update` field terbatas `{status,label}` — **guard status final online-only**; gagal → `attempts+1`, `last_error`). DI via param `supabase` (testable).
- **Provider**: `src/lib/offline/sync-context.tsx` (`SyncProvider` di `Providers.tsx`, butuh AuthProvider) — status `{online, syncing, pending, lastSyncAt, lastError}`; auto-hydrate saat login & auto-sync saat koneksi kembali; `notifyOutboxChanged()` wajib dipanggil setelah queue write; hook `useSync()`. Indikator: `SyncIndicator` (`src/components/shared/sync-indicator.tsx`) di `AppHeader`.
- **Tulis offline (Fase 3, selesai)**: hooks mutasi otomatis routing — `useSaveVisitNotes`/`useUploadPhoto`/`useDeletePhoto`/`useUpdatePhoto` (`src/features/visits/hooks/use-visit.ts`) & `useUpdateVisitStatus` (`use-schedules.ts`) membaca `useSync().online`; saat luring → `queueVisitNotesUpdate`/`queuePhotoUpload`/`queuePhotoDelete`/`queuePhotoCaptionUpdate`/`queueScheduleUpdate` (`visit-client.ts`) + toast "Tersimpan (luring)". `queueScheduleUpdate` **menolak status final** (`completed`/`gagal_total`) saat luring; patch lokal + outbox `schedules/upsert` hanya field whitelist (`status,label,latitude,longitude,accuracy,visit_time`) — engine `applyOutboxEntry` validasi ulang + whitelist sama (defense in depth). `OfflineVisitView` kini **editable** (`editable` dari role/owner) — reuse `VisitNotesForm`/`VisitGps`/`VisitStatusSelector` + upload/delete foto blob lokal (kompresi gambar sama seperti online). `OfflineScheduleRow` + `SCHEDULE_SELECT` sekarang memuat `latitude/longitude/accuracy/visit_time` (bump versi Dexie TIDAK perlu — field baru tanpa index). Test: `src/__tests__/features/visit-client-offline.test.ts` (guard status final, whitelist push, photo upload/delete/caption) + helper `src/__tests__/helpers/fake-supabase.ts` (chain `.update().eq()`; mutasi me-return proxy thenable, jangan resolve langsung).
- **Tampilan baca offline** (Fase 2b, selesai): `src/features/schedules/services/offline-read.ts` — `offlineRowToSchedule()` (bentuk `Schedule` dari kolom terdenormalisasi; type `OfflineSchedule = Schedule & {varietas}`), `filterOfflineSchedules()` (mirror filter server: status/label/user/region/rentang tanggal/member ilike/varietas like/cgr/block multi/no_plot/nis/doc/panen via `getPanenStatus`), `loadOfflineScheduleRows()`. `ScheduleTable` → saat query error otomatis load cache IDB + banner amber "Luring" + aksi edit/hapus/geser/bulk dinonaktifkan (checkbox select-all disabled, `offline` guard di `canEdit/canDelete/canBulkShift/canShift`). Halaman detail (`VisitDetail`) → fallback `getOfflineVisitDetail()` ke komponen `OfflineVisitView` (`src/features/visits/components/offline-visit-view.tsx`; kini **editable** saat peran berhak — detail: `OfflineVisitView` foto via blob objectURL, revoke di cleanup). Pola reset state saat error↔online: `prevIsError` adjust-during-render (bukan setState sync di effect — dilarang rule `react-hooks/set-state-in-effect`).
- **Queue (Fase 3 menu, API siap)**: `src/features/visits/services/visit-client.ts` — `queueVisitNotesUpdate`, `queuePhotoUpload`, `queuePhotoDelete`, `getOfflineVisitDetail`, `offlinePhotoObjectUrl`.
- **RLS storage baru** (migrasi `031_offline_rls_storage.sql`): bucket `visit-photos` privat 15MB (jpg/png/webp); folder object = `{auth.uid}/...` (insert/select/delete policy). upload client hanya untuk folder sendiri. QC offline belum didukung (RLS tidak ada manage-own untuk QC — online via server action).
- **Aturan**: jangan panggil `getOfflineDb()` di server component (guard `isOfflineDbAvailable`); perubahan schema Dexie naikkan `version()` + migrasi; IDB events outbox di-events ke provider (`fvms:outbox`).
- Test: `src/__tests__/features/offline-engine.test.ts` (fake-indexeddb + supabase fake DI).

## Deployment Workflow
- Setelah setiap commit + push ke `main`, **WAJIB** cek status deploy Vercel via API.
- Gunakan `$VERCEL_TOKEN` + `https://api.vercel.com/v6/deployments?limit=3&target=production` untuk verifikasi.
- Laporkan status (SHA, state, timestamp) ke user. Jika ERROR, segera investigasi.

## Android TWA & PWA
- Distribusi Android via **Trusted Web Activity (TWA)** — shell Bubblewrap (`android/twa-manifest.json`), tanpa rewrite web app. Panduan lengkap: `docs/ANDROID-PLAY-STORE.md`.
- Domain produksi stabil: `fvms-eight.vercel.app` (aliases Vercel); custom domain disarankan sebelum rilis production.
- PWA: Serwist (`src/app/sw.ts` via `@serwist/next`), push web listener di SW; icon PNG (192/512 + maskable + apple-touch) di-generate dari `public/icon-maskable.svg` via `npm run icons` (`scripts/generate-icons.mjs`, deps: `sharp` devDep). **Jangan edit PNG manual — regenerasi dari SVG.**
- Ikon & manifest Warna brand: `theme_color` = `#10b981` (terang) / `#065f46` (gelap); `background_color` putih.
- **Digital Asset Links**: route `src/app/.well-known/assetlinks.json/route.ts` — nilai `TWA_ANDROID_PACKAGE` (default `id.sinapp.fvms`) + `TWA_SHA256_FINGERPRINT` dari env Vercel; tanpanya ter-serve placeholder `PENDING_...` (validasi Play gagal — jangan lupa set).
- Build Android otomatis: `.github/workflows/android.yml` (tag `android-*` atau manual dispatch) → AAB + keystore artifact; keystore dipakai dari secret `TWA_KEYSTORE_B64` bila ada, selain itu di-generate per run (backup artifact!).
- Offline-first (isi kunjungan & sinkronisasi) BELUM ada — saat ini butuh koneksi.

## Filter Behavior (Excel-style)
- Schedules & Reports pages: kolom `block_no`, `no_plot`, `nis`, `document_no`, `cgr` difilter dengan **select nilai unik** (ala Excel) — bukan free-text.
- Urutan filter bar (Schedules & Reports): **kode varietas → cgr → block → plot → nama member** → nis → doc no → panen → label → status → petugas → kabupaten → kecamatan → desa (date presets di baris bawah).
- **Block = multi-select** (semantik OR, `SQL .in`): komponen `MultiFilterSelect` (`src/components/shared/multi-filter-select.tsx`; Popover + Checkbox + pencarian di dalam popover, kotak search di-reset tiap dibuka), value `string[]`, kosong = semua. Tipe `block_no?: string[]` di `ScheduleFilters`, `ReportFilters`, `DistinctFiltersInput`; builder query memakai `.in("block_no", arr)` di `getScheduleList`, `getReportData`, `getReportRows`, dan `applyDistinctRelations`.
- `useDistinctFilterValues` memakai `placeholderData: keepPreviousData` — daftar opsi lama tetap tampil saat relasi berubah (refetch background), jadi interaksi checkbox tetap mulus.
- `member_name` dan `varietas` tetap input teks (partial match `ilike`/`like`).
- Nilai unik diambil via `getDistinctScheduleValues()` (`src/features/schedules/services/schedule-service.ts`), async paralel per kolom, unik + sort numerik-aware, scoped per role:
  - Produksi: hanya nilai dari schedule miliknya (`user_id`).
  - QC: hanya nilai dalam kabupaten tugas (`kabupaten_id`).
- Client fetch: `fetchDistinctFilterValues(filters?)` (`src/features/schedules/api/schedule-client.ts`); hook: `useDistinctFilterValues(relations?)` (`src/features/schedules/hooks/use-distinct-values.ts`) — cache 5 menit, key `["schedules","distinct-values", JSON(relations)]`.
- **Relasi cascading**: opsi tiap dropdown dibatasi oleh filter lain yang aktif (re-query per perubahan/kombinasi). Diterapkan di `applyDistinctRelations()` (`schedule-service.ts`): `eq` untuk region + 4 kolom data, `in` untuk block (multi-select), `ilike` untuk `member_name`, `like` untuk `varietas` (segmen doc); **kolom itu sendiri dikecualikan** supaya dropdown tetap berisi semua nilai. Cakupan relasi: kolom data (block/plot/nis/doc/cgr) + region (kab/kec/desa) + member/varietas — status/label/panen/tanggal TIDAK ikut.
- Pages mengirim `relations` (object `useMemo`, tipe `DistinctFiltersInput` di `src/features/schedules/types/index.ts`) via prop `relations` ke `ScheduleFilters` / `ReportFiltersView`.
- Komponen bersama: `DistinctFilterSelect` (`src/components/shared/distinct-filter-select.tsx`).
- Filter **Desa**: `useDesaFilterOptions(kabupatenId?)` (`src/features/master-data/hooks/use-desa.ts`) → `fetchDesaFilterOptions()` → `getAllDesaForFilter()` (desa aktif, juga dibatasi scope QC). Muncul hanya jika kabupaten dipilih.

## Project Overview

Modern web application for Field Officers (Produksi) to manage field visit schedules. Replaces manual Excel-based workflow with a professional, mobile-first web application.

## User Roles

| Role | Enum value | Capabilities |
|------|-----------|--------------|
| Admin | `admin` | Full access: manage users, master data, import, reset all data, view all schedules; can change status and set labels |
| QC | `qc` | Quality Control — kabupaten-scoped to `assigned_kabupaten_ids` (wilayah tugas); can **view, edit, and fill all schedule data** (notes, photos, panen, GPS) within assigned kabupaten; can **change status** and **set labels** (hijau/kuning/merah) on any schedule; no user management |
| Produksi | `produksi` | Field Officers — manage ONLY their own schedules/visits (own-data-only), photos, notes, panen, GPS; can set any status including `gagal_total` |

## Statuses

| Status | Color | Setters | Description |
|--------|-------|---------|-------------|
| `pending` | amber | admin, qc, produksi | Belum dikunjungi |
| `in_progress` | yellow | admin, qc, produksi | Sedang dikerjakan |
| `gagal_partial` | orange | admin, qc, produksi | Sebagian gagal tanam |
| `completed` | green | admin, qc, produksi | Selesai |
| `gagal_total` | red | admin, qc, produksi | Gagal total |

All status transitions are unrestricted (any → any). Transitions defined in `STATUS_TRANSITIONS` in `src/lib/constants/status.ts`.

## Label (QC/Admin only)

- Column `label` on `schedules` table — values: `hijau`, `kuning`, `merah`, or `null`
- QC and Admin can set/remove labels via `VisitLabel` component on visit detail page
- Displayed as colored badge via shared `LabelBadge` component (`src/components/shared/label-badge.tsx`)
- Server action: `updateLabelAction` in `src/features/schedules/actions/schedule-actions.ts`
- Filter by label available on schedules page and reports page

## Excel Import Behavior

- **Admin-only** — accessed via "Import Excel" button on schedules page
- **Append + Upsert** — does NOT delete existing data. New records inserted, matched records updated
- **Composite key** for matching: `desa_id|block_no|no_plot|member_name` (plot identity; visit_date is updated on match except for completed schedules)
- **Intra-file dedup** — duplicate rows within same Excel file are skipped
- **Status preservation** — records already marked `completed` in the app keep their status
- **Auto-derivation** (`deriveScheduleStatus()` in `src/features/panen/services/panen-logic.ts`):
  - `sisa_di_lahan_ha = 0` + `gagal_tanam` null/0 → `completed`
  - `sisa_di_lahan_ha = 0` + `gagal_tanam > 0` + `real-gagal = 0` → `gagal_total`
  - `sisa_di_lahan_ha > 0` + `gagal_tanam > 0` + `real-gagal = sisa` → `gagal_partial`
  - `sisa_di_lahan_ha = null` + `real ≤ gagal` + `gagal > 0` → `gagal_total`
  - Jika formula tidak match + `hasActivity = true` → `in_progress`
  - Jika formula tidak match + `hasActivity = false` → `pending`
  - Jika formula tidak match + `hasActivity = undefined` → `null` (fallback ke status DB)
- **Master data auto-creation** — kabupaten/kecamatan/desa/users are auto-created if missing
- **Reset** — separate `resetAllData` action (admin-only) wipes all operational data

## Panen Status Logic

- Derived from `tgl_panen`/`real_panen`/`rencana_panen` fields; computed by `getPanenStatus()` in `src/features/panen/services/panen-logic.ts`
- States: "Panen" (harvested), "Jatuh Tempo" (overdue), "Renc: YYYY-MM-DD" (scheduled), or "—" (none)
- Filterable in schedules list and dashboard via `panen_status` filter
- **Schedule status** is auto-derived by `deriveScheduleStatus()` from `real_tanam_ha` & `gagal_tanam` (see Excel Import > Auto-derivation above)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| UI Library | shadcn/ui |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Forms | React Hook Form + Zod |
| Table | TanStack Table |
| Data Fetching | TanStack Query |
| Calendar | FullCalendar |
| Excel | SheetJS (xlsx) |
| Maps | Leaflet + OpenStreetMap |
| Deployment | Vercel |
| Repository | GitHub |

## Architecture Decisions

1. **Feature-based folder structure** inside `src/`
2. **Clean Architecture** layers: domain, application, infrastructure, presentation
3. **Repository Pattern** for database access
4. **Server Components** by default, Client Components only when needed
5. **Server Actions** for form mutations
6. **Strict TypeScript** - no `any`, no `as` casts unless unavoidable
7. **Mobile-first responsive design** with large touch targets
8. **Self-documenting code** - minimal comments, expressive naming

## Coding Standards

- TypeScript strict mode enabled
- ESLint + Prettier configured
- No duplicated code (DRY)
- Reusable UI components via shadcn/ui
- Reusable custom hooks
- Reusable services and repositories
- Feature modules are self-contained

## Folder Structure Convention

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth layout group
│   ├── (dashboard)/       # Dashboard layout group
│   └── api/               # API routes
├── components/            # Shared UI components
│   ├── ui/               # shadcn/ui primitives
│   └── shared/           # Shared app components
├── features/              # Feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── master-data/
│   ├── schedules/
│   ├── visits/
│   ├── excel-import/
│   ├── reports/
│   ├── panen/
│   ├── settings/
│   └── notifications/
├── lib/                   # Utilities & configurations
│   ├── supabase/
│   ├── utils/
│   └── constants/
├── hooks/                 # Shared custom hooks
├── types/                 # Global TypeScript types
└── styles/               # Global styles
```

## Each Feature Module Contains

```
feature-name/
├── components/           # Feature-specific components
├── hooks/               # Feature-specific hooks
├── api/                 # API client functions
├── services/            # Business logic
├── repository/          # Database access
├── schema/              # Zod validation schemas
├── types/               # Feature-specific types
└── index.ts            # Barrel export
```

## Database Naming Conventions

- Tables: `snake_case` plural (e.g., `users`, `kabupaten`, `visit_notes`)
- Columns: `snake_case` (e.g., `created_at`, `is_active`)
- Primary keys: `id` (UUID)
- Foreign keys: `{table_name_singular}_id` (e.g., `kabupaten_id`)
- Timestamps: `created_at`, `updated_at`
- Soft delete: `deleted_at`

## Git Commit Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `style:` - Formatting only
- `test:` - Tests
- `chore:` - Maintenance

## Development Workflow

1. Documentation first (in `/docs`)
2. Implement incrementally (one module at a time)
3. Each module: DB → Types → Schema → Repository → Service → API → Components → Pages
4. Never generate the entire project at once
5. Each phase must be approved before proceeding

## Quality Gates

- TypeScript compiles without errors
- No lint warnings
- Tests pass
- Mobile responsive
- Accessibility basics (keyboard nav, screen reader labels)
- No hardcoded status strings (use `SCHEDULE_STATUSES` constant from `src/lib/constants/status.ts`)
- Date formatting uses `todayString()` / `dateString()` from `src/lib/utils/date.ts` (never inline `new Date().toISOString().split("T")[0]`)
- Error logging uses `logger.error()` from `src/lib/logger.ts` on server-side

## Security Rules

- Row Level Security (RLS) enabled on all Supabase tables
- Server Actions validate input with Zod
- Never expose internal IDs in URLs (use UUIDs)
- File uploads validated for type and size
- GPS data verified server-side
- Authentication required for all routes except login
- Server Actions run via Supabase service-role but are gated by `getAuthContext()` / `canAccessSchedule()` / `qcKabupatenScope()` (centralized in `src/lib/auth/authorization.ts`)
- CSP + security headers configured in `next.config.ts`
- Login & reset-password rate-limited (`src/lib/auth/rate-limit.ts`)
- Photos stored in a PRIVATE Supabase bucket, served via signed URLs
- Structured JSON logger at `src/lib/logger.ts`; `/health` endpoint at `src/app/health/route.ts`
- Master data (kabupaten/kecamatan/desa) is ADMIN-ONLY; Excel import is ADMIN-ONLY; `resetAllData` is admin-only
- Middleware is `src/proxy.ts` (Next.js 16 file-based proxy), NOT `middleware.ts`
- Key database indexes: `idx_schedules_active` (partial on `visit_date WHERE deleted_at IS NULL`), `idx_schedules_label`

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## Testing Strategy

- Unit tests for services and utilities
- Integration tests for API routes
- Component tests for UI components
- E2E tests for critical user flows
- Use Vitest + React Testing Library

## Contact / Team

- Principal Software Architect
- Senior Product Manager
- Senior UI/UX Designer
- Senior Full Stack Engineer
- Database Architect
- DevOps Engineer
- QA Engineer
