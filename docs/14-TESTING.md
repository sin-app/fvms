# Testing Strategy

## 1. Testing Philosophy

- **Test behavior, not implementation**
- **Write tests that give confidence**
- **Follow the testing trophy** (not pyramid): Static analysis → Unit → Integration → E2E
- **Aim for 80%+ coverage** on business logic, less on UI

## 2. Test Types

### 2.1 Static Analysis (Pre-commit)
- **TypeScript strict mode** - catches type errors
- **ESLint** - catches code quality issues
- **Prettier** - ensures consistent formatting

### 2.2 Unit Tests (Vitest)
**What to test:**
- Utility functions (date formatting, string manipulation, file validation)
- Zod schemas (valid and invalid inputs)
- Service logic (status transitions, data transformations)
- Custom hooks (with renderHook)
- Validation rules

**What NOT to test:**
- shadcn/ui components (tested by library)
- TanStack Query internals
- Supabase client internals
- Simple getters/setters

### 2.3 Integration Tests (Vitest + MSW)
**What to test:**
- Server Actions (mock Supabase)
- API routes (with Next.js test helpers)
- Component + hook integration
- Form submission flows
- Error handling paths

### 2.4 Component Tests (Vitest + Testing Library)
**What to test:**
- Component rendering
- User interactions (click, type, submit)
- Loading, empty, error states
- Accessible behavior (keyboard, ARIA)
- Form validation feedback

### 2.5 E2E Tests (Playwright)
**Critical paths:**
- Login → Dashboard → View schedules
- Create schedule → Update status → Complete
- Import Excel → Map columns → Import
- View calendar → Navigate months
- Upload photo → See in gallery

## 3. Test Configuration

### 3.1 Vitest Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/components/ui/**',
        'src/types/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3.2 Mocking Strategy

**Supabase Mock:**
```typescript
// src/__tests__/mocks/supabase.ts
export const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
  then: vi.fn().mockResolvedValue({ data: null, error: null }),
}

export const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}

export const createMockSupabaseClient = () => ({
  ...mockSupabaseClient,
  auth: { ...mockSupabaseAuth },
  storage: {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    remove: vi.fn(),
  },
})
```

## 4. Test Examples

### 4.1 Utility Test
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, getStatusColor, isLate } from '@/lib/utils/date'
import { VisitStatus } from '@/types'

describe('formatDate', () => {
  it('formats ISO date to Indonesian locale', () => {
    expect(formatDate('2024-07-15')).toBe('15 Juli 2024')
  })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })
})

describe('isLate', () => {
  it('returns true for past dates that are not completed', () => {
    expect(isLate('2024-07-10', 'pending')).toBe(true)
    expect(isLate('2024-07-10', 'completed')).toBe(false)
    expect(isLate('2024-07-10', 'cancelled')).toBe(false)
  })

  it('returns false for future dates', () => {
    expect(isLate('2025-01-01', 'pending')).toBe(false)
  })
})
```

### 4.2 Schema Test
```typescript
import { describe, it, expect } from 'vitest'
import { scheduleSchema } from '@/features/schedules/schema/schedule-schema'

describe('scheduleSchema', () => {
  it('validates a correct schedule input', () => {
    const result = scheduleSchema.parse({
      user_id: 'uuid-here',
      kabupaten_id: 'uuid-here',
      kecamatan_id: 'uuid-here',
      desa_id: 'uuid-here',
      visit_date: '2024-07-15',
      notes: 'Test visit',
    })
    expect(result).toBeDefined()
  })

  it('rejects missing required fields', () => {
    expect(() => scheduleSchema.parse({})).toThrow()
  })

  it('rejects invalid dates', () => {
    expect(() =>
      scheduleSchema.parse({
        user_id: 'uuid',
        kabupaten_id: 'uuid',
        kecamatan_id: 'uuid',
        desa_id: 'uuid',
        visit_date: 'not-a-date',
      })
    ).toThrow()
  })
})
```

### 4.3 Service Test
```typescript
import { describe, it, expect, vi } from 'vitest'
import { getNextStatuses } from '@/features/visits/services/visit-service'

describe('getNextStatuses', () => {
  it('returns correct transitions from pending', () => {
    expect(getNextStatuses('pending')).toEqual(['on_the_way', 'cancelled'])
  })

  it('returns correct transitions from in_progress', () => {
    expect(getNextStatuses('in_progress')).toEqual(['completed', 'cancelled'])
  })

  it('returns empty array for completed', () => {
    expect(getNextStatuses('completed')).toEqual([])
  })

  it('returns empty array for cancelled', () => {
    expect(getNextStatuses('cancelled')).toEqual([])
  })
})
```

## 5. Test Data

### 5.1 Factory Functions
```typescript
// src/__tests__/factories.ts
import { faker } from '@faker-js/faker'

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'produksi',
  is_active: true,
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})

export const createSchedule = (overrides = {}) => ({
  id: faker.string.uuid(),
  user_id: faker.string.uuid(),
  kabupaten_id: faker.string.uuid(),
  kecamatan_id: faker.string.uuid(),
  desa_id: faker.string.uuid(),
  visit_date: faker.date.future().toISOString().split('T')[0],
  status: 'pending',
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
})
```

## 6. CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run typecheck  # tsc --noEmit
      - run: npm run lint       # eslint
      - run: npm run test       # vitest
      - run: npm run test:e2e   # playwright
      - run: npm run build      # next build
```

## 7. Quality Gates

| Gate | Tool | Threshold |
|------|------|-----------|
| Type checking | TypeScript | 0 errors |
| Linting | ESLint | 0 errors, 0 warnings |
| Formatting | Prettier | Check passes |
| Unit tests | Vitest | 100% pass, > 80% coverage |
| E2E tests | Playwright | All critical paths pass |
| Build | Next.js | Build succeeds |
| Accessibility | axe-core | 0 critical violations |
| Performance | Lighthouse | > 90 on mobile |

## 8. Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Type check
npm run typecheck

# Lint
npm run lint
```
