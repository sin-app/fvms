# FVMS — Field Visit Management System

FVMS is a mobile-first web application for managing field visit schedules. It replaces a manual Excel-based workflow with a professional system for planning, executing, and reporting field visits.

## Key Features

- **Excel import** — Admin-only: upload a schedule workbook; petugas (staff) are auto-created, master data (kabupaten/kecamatan/desa) is upserted, and schedules are appended (no duplicate cross-file). Auto-creates production auth accounts.
- **Schedules** — Browse visits grouped by day, filter by petugas/status/region/date/CGR/varietas/member/block/plot/NIS/tgl_tanam, calendar view, PDF export, bulk actions (shift date, set status).
- **Visits** — Per-schedule detail: status transitions (pending→on_the_way→in_progress→completed), GPS capture with validation, photo upload (private bucket, signed URLs), notes, activity timeline.
- **Notifications** — Real-time bell badge via Supabase Realtime; import-completed notification; daily cron for due-soon reminders (`/api/cron/notifications`).
- **Dashboard** — Stats cards (today, tomorrow, week, late, completed, pending), today schedule list, upcoming schedules, recent activity, quick actions. Filterable by kabupaten/kecamatan.
- **Reports** — Aggregated statistics (total, completed, in-progress, late) with charts and per-petugas table; filter by date/user/kabupaten/kecamatan; Excel export.
- **User management** — Admin creates users with role & assigned kabupaten (QC scope), sets passwords, activates/deactivates accounts.
- **Master data** — Admin-only: maintain kabupaten, kecamatan, and desa.
- **Mobile-first UI** — Responsive sidebar (desktop) / bottom-nav scroll (mobile); wide tables scroll horizontally. Logout from Profile & Settings pages.

## User Roles

| Role | Enum | Description |
|------|------|-------------|
| Admin | `admin` | Full access: users, master data, import, reset all data, all schedules. |
| QC | `qc` | Quality Control — kabupaten-scoped (`assigned_kabupaten_ids`): views schedules only within assigned kabupaten, uploads photos & captures GPS in the field; cannot delete/edit photos nor delete schedules. |
| Produksi | `produksi` | Field Officers — own-data-only: manage only their own schedules, visits, photos, and notes. |

Petugas (Produksi) accounts are created automatically during Excel import. Admins set their passwords from the Users page.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React Server Components, Server Actions
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database & Auth:** PostgreSQL + Supabase (Auth, Storage, RLS)
- **Data fetching:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Excel:** SheetJS (`xlsx`)
- **Maps:** Leaflet + OpenStreetMap
- **Deployment:** Vercel (with daily cron for notifications)

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
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
```

> Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) must never be exposed to the client.

## Database

Migrations live in `supabase/migrations/` (001–007). Apply them via the Supabase dashboard SQL Editor. RLS is enabled on all tables; `admin` reads all, `qc` reads only within its `assigned_kabupaten_ids` scope, `produksi` sees only its own. Server Actions use the Supabase service-role but are gated by `getAuthContext()` / `canAccessSchedule()` / `qcKabupatenScope()` (in `src/lib/auth/authorization.ts`). CSP + security headers are set in `next.config.ts`; login & reset-password are rate-limited via persistent `rate_limits` table (`src/lib/auth/rate-limit.ts`); photos live in a private bucket served via signed URLs; structured JSON logger (`src/lib/logger.ts`) with request-ID propagation; `/health` (liveness) and `/ready` (readiness) endpoints provided.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check
- `npm test` — run tests (Vitest)
- `npx vitest run` — run the 59+ passing unit/integration tests

## Deployment

Deployed on Vercel as the **fvms** project → https://fvms-eight.vercel.app. Run `vercel --prod` (or connect the repo) after setting the environment variables above. Supabase project ref: `nzpjoxndqhcvphydiyaq`. Middleware is `src/proxy.ts` (Next.js 16), not `middleware.ts`. Daily cron via `vercel.json` → `GET /api/cron/notifications` (protected by `CRON_SECRET`).

## Project Structure

```
src/
├── app/(auth)/         # Login / reset-password
├── app/(dashboard)/    # Authenticated pages (dashboard, schedules, visits, reports, notifications, users, master-data, import, settings, profile)
├── app/api/            # API routes (cron, health, ready)
├── components/         # ui/ (shadcn) + shared/
├── features/           # auth, dashboard, schedules, visits, excel-import, reports, master-data, notifications, settings
├── lib/                # supabase clients, auth helpers/authorization/rate-limit, config, logger, constants
├── hooks/              # shared hooks
├── types/              # global types (database.ts, common.ts)
└── proxy.ts            # Next.js 16 middleware (auth guard, request-ID)
```
