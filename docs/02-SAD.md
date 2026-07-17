# Software Architecture Document (SAD)

## 1. Architectural Overview

The FVMS follows **Clean Architecture** principles with a **feature-based folder structure**. The architecture enforces separation of concerns, testability, and maintainability through distinct layers.

```
┌─────────────────────────────────────────────┐
│              Presentation Layer              │
│  Next.js App Router + Server/Client Comps   │
├─────────────────────────────────────────────┤
│           Application Layer                  │
│  Server Actions + Services + Use Cases      │
├─────────────────────────────────────────────┤
│            Domain Layer                      │
│  Entities + Value Objects + Interfaces      │
├─────────────────────────────────────────────┤
│          Infrastructure Layer                │
│  Supabase Client + Repository Implementations│
└─────────────────────────────────────────────┘
```

## 2. Architecture Principles

### 2.1 Clean Architecture
- **Domain Layer:** Core business logic, entities, types, interfaces
- **Application Layer:** Use cases, server actions, services
- **Infrastructure Layer:** Database access, external services, repositories
- **Presentation Layer:** UI components, pages, layouts

### 2.2 SOLID Principles
- **S**ingle Responsibility: Each module has one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Derived types are substitutable
- **I**nterface Segregation: Specific interfaces over general ones
- **D**ependency Inversion: Depend on abstractions, not concretions

### 2.3 Key Architectural Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-01 | Feature-based folder structure | Co-locates related code, easy navigation |
| AD-02 | Server Components by default | Better performance, smaller JS bundle |
| AD-03 | Server Actions for mutations | No API routes needed for CRUD |
| AD-04 | TanStack Query for client data | Caching, refetching, optimism |
| AD-05 | Repository Pattern | Abstracts data access, testable |
| AD-06 | Row Level Security (RLS) | Security at database level |
| AD-07 | TypeScript strict mode | Catch errors at compile time |
| AD-08 | Zod for validation | Runtime type safety |
| AD-09 | React Hook Form | Performant form management |
| AD-10 | Supabase for everything backend | Reduced complexity, unified platform |

## 3. Data Flow Architecture

### 3.1 Server Data Flow (Preferred)
```
Browser → Next.js Server Component → Supabase (RLS) → Response
                                 ↓
                     Server Action (mutation)
```

### 3.2 Client Data Flow (When Interactivity Needed)
```
Browser → Client Component → TanStack Query → Server Action/API → Supabase
                                 ↓
                           React Hook Form → Zod Validation
```

### 3.3 File Upload Flow
```
Browser → Client Component → Supabase Storage (direct upload)
                                 ↓
                      Save metadata to database
```

### 3.4 GPS Capture Flow
```
Browser → Geolocation API → Client Component → Server Action → Database
```

## 4. Rendering Strategy

| Page Type | Strategy | Reason |
|-----------|----------|--------|
| Login | Client | Interactive form |
| Dashboard | Server + Client islands | Static data + interactive widgets |
| Master Data | Server | Mostly read-only with actions |
| Schedule List | Client | Search, filter, pagination |
| Calendar | Client | Interactive calendar |
| Visit Detail | Client | Multiple user interactions |
| Reports | Client | Filtering and export |
| Import | Client | File upload, preview |

## 5. State Management

- **Server State:** TanStack Query (cache, sync, refetch)
- **Form State:** React Hook Form (local form state)
- **URL State:** Next.js search params (filters, pagination)
- **UI State:** React useState/useReducer (local UI state)
- **Auth State:** Supabase Auth session listener
- **Global State:** React Context (only for truly global state like theme, auth)

## 6. Security Architecture

### 6.1 Authentication Flow
```
User → Login Page → Supabase Auth → Session Token → RLS Policy
```

### 6.2 Authorization (RLS Policies)
- **Users table:** Users can read own record; admins can read all
- **Schedules table:** Field Officers see own; Supervisors see assigned; Admins see all
- **Visit notes:** Same as schedules
- **Photos:** Same as schedules

### 6.3 Data Protection
- All passwords hashed by Supabase Auth (bcrypt)
- All API calls over HTTPS
- File uploads scanned for type validity
- Input sanitization via Zod
- SQL injection prevented by Supabase client

## 7. Error Handling Strategy

- **Server Actions:** Return `{ success: boolean, error?: string, data?: T }`
- **TanStack Query:** Error boundaries + retry logic
- **Forms:** Inline field validation + submission errors
- **File Uploads:** Progress tracking + error states
- **Global:** 404 page, 500 page, error boundaries

## 8. Performance Strategy

- Server Components reduce client JS
- Image optimization via Next.js Image
- TanStack Query caching reduces API calls
- Supabase indexes on frequently queried columns
- Lazy loading for calendar and maps
- Code splitting by routes (Next.js automatic)

## 9. Deployment Architecture

```
GitHub Repository → Vercel → Supabase
      │                         │
   Push/PR                    PostgreSQL
      │                         │
  Vercel Build               Supabase Auth
      │                         │
  Vercel Deploy             Supabase Storage
```

## 10. Monitoring & Observability

- Vercel Analytics for performance
- Supabase Dashboard for database
- Error logging via console.error + optional Sentry
- Activity logs table for user actions
