# FVMS - Field Visit Management System

## Project Overview

Modern web application for Field Officers (Produksi) to manage field visit schedules. Replaces manual Excel-based workflow with a professional, mobile-first web application.

## User Roles

| Role | Enum value | Capabilities |
|------|-----------|--------------|
| Admin | `admin` | Full access: manage users, master data, import, reset all data, view all schedules |
| QC | `qc` | Quality Control — kabupaten-scoped to `assigned_kabupaten_ids` (wilayah tugas); can VIEW schedules only within assigned kabupaten, UPLOAD photos and CAPTURE GPS in the field, but CANNOT delete/edit photos and CANNOT delete schedules; no user management |
| Produksi | `produksi` | Field Officers — manage ONLY their own schedules/visits (own-data-only), photos, notes |

Notes:
- `qc` and `admin` are "privileged" (`isPrivileged` in `src/lib/auth/authorization.ts`). QC sees schedules only within its `assigned_kabupaten_ids` scope via `qcKabupatenScope()`; admin sees all. Access is enforced centrally through `getAuthContext()` / `canAccessSchedule()`.
- Produksi accounts are auto-created during Excel import (auth account + random password set later by admin).
- Role is read from the JWT `app_metadata.role` / `user_metadata.role` (not from `public.users` select on the client).

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
- No hardcoded strings (use constants/enums)

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
