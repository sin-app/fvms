# FVMS — Field Visit Management System

FVMS is a mobile-first web application for managing field visit schedules. It replaces a manual Excel-based workflow with a professional system for planning, executing, and reporting field visits.

## Key Features

- **Excel import** — Upload a schedule workbook; petugas (staff) are auto-created, master data (kabupaten/kecamatan/desa) is upserted, and schedules replace the previous pending data.
- **Schedules** — Browse visits grouped by day, filter by petugas/status/region/date, calendar view, PDF export.
- **Visits** — Per-schedule detail: status, GPS location, notes, and photo documentation (Supabase Storage).
- **Reports** — Aggregated visit statistics and per-petugas breakdowns.
- **User management** — Admin creates/users, sets passwords directly, and activates/deactivates accounts.
- **Master data** — Maintain kabupaten, kecamatan, and desa.
- **Mobile-first UI** — Responsive sidebar (desktop) / bottom-nav + hamburger drawer (mobile); wide tables scroll horizontally.

## User Roles

| Role | Enum | Description |
|------|------|-------------|
| Admin | `admin` | Full access: users, master data, import, all schedules. |
| QC | `qc` | Quality Control — views **all** Produksi schedules for inspection & land assessment. |
| Produksi | `produksi` | Field Officers — own schedules, visits, photos, and notes. |

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
- **Deployment:** Vercel

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
```

> Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`) must never be exposed to the client.

## Database

Migrations live in `supabase/migrations/`. Apply them via the Supabase CLI or the Supabase dashboard. RLS is enabled on all tables; privileged roles (`admin`, `qc`) can read all schedules, while `produksi` sees only their own.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check
- `npm test` — run tests (Vitest)

## Deployment

Deployed on Vercel. Run `vercel --prod` (or connect the repo) after setting the environment variables above.

## Project Structure

```
src/
├── app/(auth)/         # Login / reset-password
├── app/(dashboard)/    # Authenticated pages
├── components/         # ui/ (shadcn) + shared/
├── features/           # auth, dashboard, schedules, visits, excel-import, reports, master-data, notifications
├── lib/                # supabase clients, auth helpers, config, constants
├── hooks/              # shared hooks
└── types/              # global types
```
