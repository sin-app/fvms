# Folder Structure

```
fvms/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   └── pre-commit
├── docs/
│   ├── 01-PRD.md
│   ├── 02-SAD.md
│   ├── 03-ERD.md
│   ├── 04-DATABASE.md
│   ├── 05-API-SPEC.md
│   ├── 06-FOLDER-STRUCTURE.md
│   ├── 07-UI-UX.md
│   ├── 08-COMPONENTS.md
│   ├── 09-USER-FLOW.md
│   ├── 10-WIREFRAME.md
│   ├── 11-ROADMAP.md
│   ├── 12-TASK-BREAKDOWN.md
│   ├── 13-RISK-ANALYSIS.md
│   ├── 14-TESTING.md
│   ├── 15-DEPLOYMENT.md
│   └── 16-FUTURE-ROADMAP.md
│
├── public/
│   ├── images/
│   └── icons/
│
├── scripts/
│   └── seed.ts
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── master-data/
│   │   │   │   ├── kabupaten/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── kecamatan/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── desa/
│   │   │   │       └── page.tsx
│   │   │   ├── schedules/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── calendar/
│   │   │   │       └── page.tsx
│   │   │   ├── visits/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── import/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx        (admin only)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx             (redirect to dashboard)
│   │   │
│   │   ├── api/
│   │   │   ├── reports/
│   │   │   │   ├── daily/route.ts
│   │   │   │   ├── weekly/route.ts
│   │   │   │   └── monthly/route.ts
│   │   │   ├── photos/
│   │   │   │   ├── upload/route.ts
│   │   │   │   └── delete/route.ts
│   │   │   └── excel/
│   │   │       └── template/route.ts
│   │   │
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── separator.tsx
│   │   │   └── ... (other shadcn components)
│   │   │
│   │   └── shared/
│   │       ├── app-sidebar.tsx
│   │       ├── app-header.tsx
│   │       ├── app-footer.tsx
│   │       ├── data-table.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-state.tsx
│   │       ├── loading-state.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── search-input.tsx
│   │       ├── date-range-picker.tsx
│   │       ├── file-upload.tsx
│   │       ├── status-badge.tsx
│   │       ├── stat-card.tsx
│   │       └── page-header.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── reset-password-form.tsx
│   │   │   │   └── profile-form.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   └── use-session.ts
│   │   │   ├── api/
│   │   │   │   └── auth-client.ts
│   │   │   ├── schema/
│   │   │   │   └── auth-schema.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── stats-cards.tsx
│   │   │   │   ├── today-schedule.tsx
│   │   │   │   ├── upcoming-schedule.tsx
│   │   │   │   ├── recent-activity.tsx
│   │   │   │   └── quick-actions.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-dashboard.ts
│   │   │   ├── api/
│   │   │   │   └── dashboard-client.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── master-data/
│   │   │   ├── components/
│   │   │   │   ├── kabupaten-table.tsx
│   │   │   │   ├── kabupaten-form.tsx
│   │   │   │   ├── kecamatan-table.tsx
│   │   │   │   ├── kecamatan-form.tsx
│   │   │   │   ├── desa-table.tsx
│   │   │   │   ├── desa-form.tsx
│   │   │   │   └── region-selector.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-kabupaten.ts
│   │   │   │   ├── use-kecamatan.ts
│   │   │   │   └── use-desa.ts
│   │   │   ├── api/
│   │   │   │   ├── kabupaten-client.ts
│   │   │   │   ├── kecamatan-client.ts
│   │   │   │   └── desa-client.ts
│   │   │   ├── schema/
│   │   │   │   └── master-data-schema.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   └── master-data-service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── schedules/
│   │   │   ├── components/
│   │   │   │   ├── schedule-table.tsx
│   │   │   │   ├── schedule-form.tsx
│   │   │   │   ├── schedule-filters.tsx
│   │   │   │   ├── schedule-actions.tsx
│   │   │   │   └── calendar-view.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-schedules.ts
│   │   │   │   ├── use-schedule.ts
│   │   │   │   └── use-calendar.ts
│   │   │   ├── api/
│   │   │   │   └── schedule-client.ts
│   │   │   ├── schema/
│   │   │   │   └── schedule-schema.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   └── schedule-service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── visits/
│   │   │   ├── components/
│   │   │   │   ├── visit-status-selector.tsx
│   │   │   │   ├── visit-notes-form.tsx
│   │   │   │   ├── visit-photos.tsx
│   │   │   │   ├── visit-gps.tsx
│   │   │   │   ├── visit-timeline.tsx
│   │   │   │   └── visit-detail.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-visit.ts
│   │   │   │   ├── use-gps.ts
│   │   │   │   └── use-photos.ts
│   │   │   ├── api/
│   │   │   │   ├── visit-client.ts
│   │   │   │   └── photo-client.ts
│   │   │   ├── schema/
│   │   │   │   └── visit-schema.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   └── visit-service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── excel-import/
│   │   │   ├── components/
│   │   │   │   ├── file-uploader.tsx
│   │   │   │   ├── column-mapping.tsx
│   │   │   │   ├── preview-table.tsx
│   │   │   │   ├── validation-report.tsx
│   │   │   │   └── import-progress.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-excel-import.ts
│   │   │   │   └── use-excel-preview.ts
│   │   │   ├── api/
│   │   │   │   └── excel-client.ts
│   │   │   ├── schema/
│   │   │   │   └── excel-schema.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   └── excel-service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── components/
│   │   │   │   ├── report-filters.tsx
│   │   │   │   ├── report-table.tsx
│   │   │   │   ├── report-chart.tsx
│   │   │   │   └── export-buttons.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-reports.ts
│   │   │   ├── api/
│   │   │   │   └── report-client.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── notifications/
│   │       ├── components/
│   │       │   ├── notification-list.tsx
│   │       │   ├── notification-item.tsx
│   │       │   └── notification-bell.tsx
│   │       ├── hooks/
│   │       │   └── use-notifications.ts
│   │       ├── api/
│   │       │   └── notification-client.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server-client.ts    # Server component client
│   │   │   └── admin-client.ts     # Service role client
│   │   ├── utils/
│   │   │   ├── cn.ts              # className merge utility
│   │   │   ├── date.ts            # Date formatting utilities
│   │   │   ├── format.ts          # Number/string formatting
│   │   │   ├── file.ts            # File validation utilities
│   │   │   ├── gps.ts             # GPS utilities
│   │   │   └── compress-image.ts  # Image compression utility
│   │   └── constants/
│   │       ├── index.ts
│   │       ├── status.ts
│   │       └── roles.ts
│   │
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   ├── use-intersection-observer.ts
│   │   └── use-local-storage.ts
│   │
│   ├── types/
│   │   ├── database.ts            # Supabase database types
│   │   ├── common.ts              # Common shared types
│   │   └── next.ts                # Next.js extended types
│   │
│   └── styles/
│       └── globals.css
│
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── components.json               # shadcn/ui config
├── middleware.ts                  # Next.js middleware (auth)
└── AGENTS.md
```

## Key Structural Decisions

1. **Feature-based organization** - Each feature is self-contained with its own components, hooks, API, schema, types, and services.

2. **Shared components** - Reusable UI primitives in `components/ui/` (shadcn) and app-specific in `components/shared/`.

3. **Lib layer** - Contains all third-party client initialization (Supabase) and utility functions.

4. **Route groups** - `(auth)` for unauthenticated pages, `(dashboard)` for authenticated pages.

5. **API routes** - Minimal; only used when Server Actions cannot handle the task (file generation, external API calls).

6. **No global state management** - Server state via TanStack Query, form state via React Hook Form, URL state via search params.
