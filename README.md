# FVMS — Field Visit Management System

FVMS is a mobile-first web application for managing field visit schedules. It replaces a manual Excel-based workflow with a professional system for planning, executing, and reporting field visits. It is also packaged as an installable **PWA** and an **Android TWA** app.

## Key Features

- **Excel import** — Admin-only: upload a schedule workbook; petugas (staff) are auto-created, master data (kabupaten/kecamatan/desa) is upserted, and schedules are appended (no duplicate cross-file). **Upsert on composite key** (`desa_id|block_no|no_plot|member_name`): when a row matches an existing schedule, its columns are **updated** with the new Excel values (except `visit_date` is preserved for `completed` records). Auto-creates production auth accounts. If the import fails mid-run, the `excel_imports` record is marked `failed` with an `error_log` (it no longer gets stuck in `processing`).
- **Schedules** — Browse visits grouped by day, filter by petugas/status/region/date/CGR/varietas/member/block/plot/NIS/tgl_tanam, calendar view, PDF export, bulk actions (shift date, set status).
- **Visits** — Per-schedule detail: status transitions (`pending → in_progress → completed / gagal_partial / gagal_total`), GPS capture with validation, photo upload (private bucket, signed URLs), notes, activity timeline.
- **Notifications** — Real-time bell badge via Supabase Realtime; import-completed notification; daily cron for due-soon reminders (`/api/cron/notifications`).
- **Dashboard** — Stats cards (today, tomorrow, week, late, completed, pending), today schedule list, upcoming schedules, recent activity, quick actions. Filterable by kabupaten/kecamatan.
- **Reports** — Aggregated statistics (total, completed, in-progress, late) with charts and per-petugas table; filter by date/user/kabupaten/kecamatan; Excel export.
- **User management** — Admin creates users with role & assigned kabupaten (QC scope), sets passwords, activates/deactivates accounts.
- **Master data** — Admin-only: maintain kabupaten, kecamatan, and desa.
- **Mobile-first PWA UI** — Responsive sidebar (desktop) / bottom-nav (mobile); wide tables scroll horizontally; installable with offline support (Serwist service worker).
- **External REST API (`/api/v1`)** — Bearer-API-key auth for programmatic access with role-scoped data (admin sees all, QC sees assigned kabupaten, produksi sees own). CORS-enabled.

## User Roles

| Role | Enum | Description |
|------|------|-------------|
| Admin | `admin` | Full access: users, master data, import, reset all data, all schedules, API key management. |
| QC | `qc` | Quality Control — kabupaten-scoped (`assigned_kabupaten_ids`): views schedules only within assigned kabupaten, uploads photos & captures GPS in the field; cannot delete/edit photos nor delete schedules. |
| Produksi | `produksi` | Field Officers — own-data-only: manage only their own schedules, visits, photos, and notes. |

Petugas (Produksi) accounts are created automatically during Excel import. Admins set their passwords from the Users page.

## Schedule Status Lifecycle

Status is a strict enum (`pending`, `in_progress`, `gagal_partial`, `completed`, `gagal_total`) enforced at the schema layer (`src/features/schedules/schema/schedule-schema.ts`). Allowed transitions (`src/lib/constants/status.ts`):

```
pending      → in_progress, gagal_partial, completed, gagal_total
in_progress  → gagal_partial, completed, gagal_total
gagal_partial→ completed, gagal_total
completed    → in_progress
gagal_total  → (terminal)
```

Status is auto-derived from visit activity (real/gagal tanam, sisa di lahan, panen dates) via `deriveScheduleStatus`.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React Server Components, Server Actions
- **Language:** TypeScript (strict — `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`; `exactOptionalPropertyTypes` is intentionally **off** for Supabase generated-row compatibility)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database & Auth:** PostgreSQL + Supabase (Auth, Storage, RLS)
- **Data fetching:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Excel:** ExcelJS (`exceljs`)
- **Maps:** Leaflet + OpenStreetMap
- **PWA:** Serwist (`@serwist/next`) — service worker (`src/app/sw.ts`), web manifest (`public/manifest.json`)
- **Android:** Trusted Web Activity (folder `android/`)
- **Deployment:** Vercel (daily cron, preview/production), GitHub Actions CI

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials + VERCEL tokens if deploying
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=                  # for /api/cron/notifications
CORS_ALLOWED_ORIGINS=         # comma-separated origins for /api/v1 (default: *)
TWA_SHA256_FINGERPRINT=       # set by android.yml for TWA trust
TWA_ANDROID_PACKAGE=          # default id.sinapp.fvms
```

> Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) must never be exposed to the client. All required secrets are read centrally in `src/lib/config.ts` via a fail-fast `requiredEnv()`; the service-role key is never read anywhere else.

## Database

Migrations live in `supabase/migrations/` (currently `001_initial.sql` … `037_rls_db_source.sql`, 37 files). Apply them via the Supabase dashboard SQL Editor (or `supabase db push`). RLS is enabled on all tables; `admin` reads all, `qc` reads only within its `assigned_kabupaten_ids` scope, `produksi` sees only its own. Server Actions use the Supabase service-role but are gated by `getAuthContext()` / `canAccessSchedule()` / `qcKabupatenScope()` (in `src/lib/auth/authorization.ts`).

## External API (`/api/v1`)

Authenticated with a Bearer API key (generated from **Settings → API Keys**, admin-only). Keys are stored hashed (`sha256`) in `api_keys`; the plaintext is returned only once at creation.

| Endpoint | Method | Auth scope | Notes |
|----------|--------|-----------|-------|
| `/api/v1/schedules` | GET | role-scoped | Paginated schedules (`page`, `limit`, `status`, `kabupaten_id`) |
| `/api/v1/reports` | GET | role-scoped | Aggregate stats (`date_from`, `date_to`, optional `user_id`/`kabupaten_id`) |
| `/api/v1/keys` | GET/POST/DELETE | admin | List / create / revoke API keys |

- **CORS:** enabled; configure allowed origins with `CORS_ALLOWED_ORIGINS` (default `*`). A `OPTIONS` preflight handler is provided on every route.
- **Rate limit:** soft limit 300 req/min/key (in-memory per instance; the persistent `rate_limits` table backs login rate-limiting).
- All routes return a standardized error body: `{ "error": { "message": string, "code": AppErrorCode } }`.

## Error Handling

Centralized in `src/lib/errors.ts`:

- `AppError` — typed error with `code` (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `VALIDATION`, `INTERNAL`) and HTTP `status`.
- `handleError(err)` normalizes any thrown error into `{ status, body }`; server-side (`>=500`) errors are logged via the structured logger.
- `nextErrorResponse(err)` produces a `NextResponse` for route handlers.

## Security

- Secrets centralized and fail-fast (`src/lib/config.ts`); service-role key is server-only.
- API keys hashed (`sha256`); plaintext shown once.
- Login attempts rate-limited via persistent `rate_limits` table (`src/lib/auth/rate-limit.ts`); API keys rate-limited per key.
- Security headers (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP) set in `next.config.ts`.
- Photos stored in a **private** Supabase bucket, served only via signed URLs.
- Structured JSON logger (`src/lib/logger.ts`) with request-ID propagation.
- Liveness/readiness: `/health` and `/ready` (DB check) endpoints.

> **Credential hygiene:** never embed tokens (GitHub PAT, Supabase keys, Vercel token) in URLs or commit them. If a secret is exposed, rotate it immediately.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (`next build --webpack`)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check
- `npm test` — run unit/integration tests (Vitest)
- `npx playwright test` — E2E tests

## Deployment

Deployed on Vercel as the **fvms** project → https://fvms-eight.vercel.app.

- **Build:** `vercel deploy --prod` (or connect the GitHub repo; push to `main` triggers auto-deploy). Supabase project ref: `nzpjoxndqhcvphydiyaq`.
- **Middleware:** `src/proxy.ts` (Next.js 16), not `middleware.ts`.
- **Cron:** `vercel.json` → `GET /api/cron/notifications` daily at `07:00 UTC` (protected by `CRON_SECRET`).
 - **CI:** `.github/workflows/ci.yml` runs typecheck, lint, unit tests, production build, and Playwright E2E on every push/PR to `main`.

 ### Self-hosting with Docker (standalone)

 The app builds to a **standalone** Next.js server (`output: "standalone"` in `next.config.ts`) that runs without Vercel. `Dockerfile` (multi-stage, `node:20-bookworm-slim`) and `docker-compose.yml` are provided.

 ```bash
 # 1. Provide runtime + build-time env (copy .env.example -> .env and fill in)
 cp .env.example .env
 # 2. Build & run the container
 docker compose up -d --build
 # 3. Verify
 curl http://localhost:3000/health   # {"status":"ok"}
 curl http://localhost:3000/ready    # {"status":"ok","checks":{"database":"ok"}}
 ```

 Notes for self-hosting:
 - Build-time public env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`) is passed via compose `args`; runtime env (incl. `SUPABASE_SERVICE_ROLE_KEY`) via `env_file: .env`.
 - `sharp` is externalized (`serverExternalPackages`) so the standalone image is buildable without tracing its native binaries.
 - **Cron does not run inside the container** — Vercel's daily cron is bypassed. Schedule it on the host, e.g. daily `curl -H "Authorization: Bearer $CRON_SECRET" https://your-host/api/cron/notifications`.
 - **Automated image build:** `.github/workflows/docker.yml` builds & pushes the image to GitHub Container Registry (`ghcr.io/<repo>/fvms`) on every push to `main` and on `v*` tags (override public build args via repo **Variables**). Pull with `docker pull ghcr.io/<repo>/fvms:main`.

 ### Verify a deploy

 ```bash
 curl https://fvms-eight.vercel.app/health   # {"status":"ok"}
 curl https://fvms-eight.vercel.app/ready    # {"status":"ok","checks":{"database":"ok"}}
 ```

 ## Android App (TWA)

 FVMS is also packaged as a native Android app via **Trusted Web Activity** (folder `android/`) that opens the live PWA on Vercel fullscreen. Build & distribution **without Play Store** is done through GitHub Actions — see **[`android/README.md`](android/README.md)** for the full guide (keystore secret, sideload APK, `assetlinks.json` trust).

 ### Build the APK via GitHub Actions (one click)

 1. Go to **Actions → Android TWA Release** in the GitHub repo.
 2. Click **Run workflow** (manual `workflow_dispatch`, or push a `v*` tag).
 3. The workflow runs `./gradlew :app:assembleRelease :app:bundleRelease`, uploads **APK + AAB** as artifacts, and commits `public/.well-known/assetlinks.json` + deploys to Vercel to establish TWA trust.
 4. Download the `fvms-release-apk` artifact and sideload it (`adb install` / file manager). Requires the repo secret `TWA_KEYSTORE_B64` (and `TWA_KEYSTORE_PASSWORD` / `TWA_KEY_ALIAS`).

 The app wraps `https://fvms-eight.vercel.app/` (`namespace`/`applicationId` = `id.sinapp.fvms`).

 ### Local APK build (alternative)

 If you have the Android SDK + JDK 17 locally, run `./scripts/build-android.sh` (it generates a debug keystore if none is provided via `TWA_KEYSTORE_PATH`). Output: `android/app/build/outputs/apk/release/*.apk`.

## Flutter App

Native Flutter app (`fvms_flutter/`) with full offline support, GPS, camera, and push notifications. Builds via CI on every push to `main`.

### Features

- **Dashboard** — Hero greeting, stats cards (snap-scroll on mobile), today's schedules, upcoming list
- **Schedules** — Card view (mobile) + table (desktop), Excel-style filters (cascading region, multi-select block, status/label/member/varietas/date presets), bulk actions, offline cache fallback
- **Calendar** — `table_calendar` with event dots, status colors, auto-select today, pull-to-refresh, Indonesian locale
- **Visit Detail** — Status transitions with chips, GPS capture + OpenStreetMap view, photo upload (camera/gallery) with signed URL, notes (observation/problem/recommendation), QC label toggle (hijau/kuning/merah)
- **Reports** — KPI grid, pie/bar charts (fl_chart), officer & kabupaten breakdowns, data table with Excel export
- **Pengajuan Lahan** — Full CRUD: create proposal (region cascading, plot fields, GPS, notes), detail view, approve/reject (QC/Admin), cancel (owner), photo gallery
- **Profile** — Avatar initials, role badge, assigned kabupaten, **light/dark mode toggle** (persisted via HydratedBloc), admin link to web
- **Offline-first** — Dexie/IndexedDB-like Drift database, outbox queue for mutations, role-scoped hydration, auto-sync on reconnect
- **Push Notifications** — Firebase Cloud Messaging, topic-based

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flutter 3.x (Dart) |
| State | BLoC + HydratedBloc (persistence) |
| Database | Drift (SQLite) for offline |
| Auth | Supabase Auth |
| Storage | Supabase Storage (signed URLs) |
| Maps | flutter_map + OpenStreetMap |
| Charts | fl_chart |
| Calendar | table_calendar |
| Camera/Gallery | image_picker |
| Location | geolocator |
| Notifications | firebase_messaging |
| CI | GitHub Actions (`flutter.yml`) |

### Environment Variables

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

Passed via `--dart-define` in CI. For local dev, create `fvms_flutter/.env`.

### Build

```bash
cd fvms_flutter
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter build apk --release --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```

CI builds automatically on push to `main`: analyze → test → APK + AAB artifacts.

### Download

Download the latest APK/AAB from [GitHub Releases](https://github.com/sin-app/fvms/releases) or from the [Flutter CI artifacts](https://github.com/sin-app/fvms/actions/workflows/flutter.yml).

### Project Structure

```
fvms_flutter/lib/
├── app/                    # App shell, router, theme (light/dark)
├── core/                   # Supabase client, auth context, offline engine, constants
├── features/
│   ├── auth/               # Login, reset password, profile
│   ├── dashboard/          # Dashboard page + BLoC
│   ├── schedules/          # Schedule list, calendar, filter sheet + BLoC
│   ├── visits/             # Visit detail (status, GPS, photos, notes) + BLoC
│   ├── reports/            # Reports page + BLoC
│   ├── land_proposals/     # Pengajuan lahan (CRUD, approve/reject) + BLoC
│   ├── panen/              # Panen status logic
│   └── notifications/      # Push notification handler
├── widgets/                # Shared widgets (LoadingState, ErrorState, EmptyState, SyncIndicator)
└── __tests__/              # Unit & integration tests
```

## Project Structure

```
src/
├── app/(auth)/         # Login / reset-password
├── app/(dashboard)/    # Authenticated pages (dashboard, schedules, visits, reports, notifications, users, master-data, import, settings, profile)
├── app/api/            # API routes: cron, health, ready, push, and v1/ (schedules, reports, keys)
├── components/         # ui/ (shadcn) + shared/
├── features/           # auth, dashboard, schedules, visits, excel-import, reports, master-data, notifications, settings, panen, land-proposals
├── lib/                # supabase clients, auth helpers/authorization/rate-limit, config, logger, errors, cors, constants
├── hooks/              # shared hooks
├── types/              # global types (database.ts, common.ts)
└── proxy.ts            # Next.js 16 middleware (auth guard, request-ID)
```
