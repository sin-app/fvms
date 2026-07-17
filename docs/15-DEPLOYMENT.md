# Deployment Guide

## 1. Architecture Overview

```
Internet → Vercel (Edge Network) → Next.js App → Supabase
                                                    ├── PostgreSQL
                                                    ├── Auth
                                                    └── Storage
```

## 2. Prerequisites

### Accounts Required
- GitHub account (code repository)
- Vercel account (hosting)
- Supabase account (database, auth, storage)

### Local Tools
- Node.js 20+
- npm 10+
- Git
- VS Code (recommended)

## 3. Supabase Setup

### 3.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New project
2. Choose organization, project name: `fvms`
3. Set database password (strong, unique)
4. Select region closest to users (e.g., Singapore for Indonesia)
5. Wait for database provisioning (~2 minutes)

### 3.2 Configure Authentication
1. Go to Authentication → Settings
2. Enable email/password auth provider
3. Configure Site URL: `https://fvms.vercel.app` (update after Vercel deploy)
4. Configure Redirect URLs:
   - `https://fvms.vercel.app/**`
   - `http://localhost:3000/**` (development)
5. Customize email templates for password reset

### 3.3 Configure Storage
1. Go to Storage → Create bucket: `visit-photos`
2. Set bucket to public (images are accessed via URLs)
3. Create storage policy:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'visit-photos');

-- Allow public read
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'visit-photos');

-- Allow users to delete own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);
```

### 3.4 Run Database Migrations
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/001_initial.sql`
3. Execute the migration
4. Verify tables created in Table Editor

## 4. Vercel Setup

### 4.1 Project Configuration
1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import GitHub repository
3. Configure project:

**Framework Preset:** Next.js
**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

### 4.2 Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_APP_URL=https://fvms.vercel.app
```

**Important:** 
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` from same page (keep secret, never expose to client)
- `NEXT_PUBLIC_APP_URL` is the Vercel deployment URL

### 4.3 Deploy
1. Click "Deploy"
2. Wait for build (~3-5 minutes)
3. First deployment will be at `fvms-git-main-xxxxx.vercel.app`
4. Configure custom domain if needed

## 5. Local Development Setup

### 5.1 Clone & Install
```bash
git clone https://github.com/your-org/fvms.git
cd fvms
npm install
```

### 5.2 Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5.3 Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 5.4 Create Initial Admin User
1. Register via the app (if registration is enabled)
2. Or use Supabase SQL Editor:
```sql
-- Create admin user in auth.users first via Supabase UI
-- Then insert into public.users
INSERT INTO public.users (id, email, name, role)
VALUES (
  'auth-user-id',
  'admin@fvms.com',
  'Admin FVMS',
  'admin'
);
```

## 6. CI/CD Pipeline

### 6.1 GitHub Actions Workflow
The CI pipeline runs on every push and PR:
- TypeScript type checking
- ESLint
- Unit tests
- Build check
- E2E tests (if configured)

### 6.2 Branch Strategy
```
main          → Production (auto-deploy to Vercel)
staging       → Staging (auto-deploy to Vercel preview)
feature/*     → Feature branches (preview deployments)
fix/*         → Bug fix branches
```

### 6.3 Vercel Preview Deployments
- Every PR gets a unique preview URL
- Each preview has its own environment variables (can link to preview Supabase)
- Preview deployments are ideal for testing

## 7. Production Checklist

### 7.1 Pre-Launch
- [ ] All environment variables configured in Vercel
- [ ] Custom domain configured with SSL
- [ ] Supabase project on Pro plan (for production)
- [ ] Database backups enabled
- [ ] RLS policies tested
- [ ] Auth redirect URLs updated for production domain
- [ ] Email templates customized (branding)
- [ ] Storage bucket policies configured
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Error tracking configured (optional: Sentry)
- [ ] Analytics configured (optional: Vercel Analytics)

### 7.2 Post-Launch
- [ ] Monitor error rates for first 48 hours
- [ ] Check database query performance
- [ ] Verify storage usage
- [ ] Collect user feedback
- [ ] Performance optimization based on real usage

## 8. Environment Management

| Environment | URL | Supabase | Purpose |
|-------------|-----|----------|---------|
| Local | localhost:3000 | Local/Dev | Development |
| Preview | fvms-git-xxx.vercel.app | Dev | PR Testing |
| Staging | staging.fvms.com | Staging | Pre-release |
| Production | fvms.com | Production | Live |

## 9. Database Backups

### 9.1 Automated (Supabase Pro)
- Daily backups: 7-day retention
- Point-in-time recovery: 7-day window
- Scheduled backups configurable in Supabase dashboard

### 9.2 Manual Backup
```bash
# Using Supabase CLI
supabase db dump --db-url postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres > backup.sql

# Using pg_dump
pg_dump "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" > backup.sql
```

### 9.3 Restore
```bash
# Using Supabase CLI
supabase db restore backup.sql

# Using psql
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" < backup.sql
```

## 10. Rollback Plan

If a deployment causes issues:
1. **Vercel Dashboard** → Deployments → Last working deployment → "Promote to Production"
2. If database migration is the issue:
   - Run reverse migration
   - Or restore from backup

## 11. Monitoring & Alerts

### 11.1 Vercel Monitoring
- **Vercel Analytics:** Real-time traffic, performance metrics
- **Vercel Speed Insights:** Core Web Vitals
- **Vercel Logs:** Application logs (Console tab)

### 11.2 Supabase Monitoring
- **Database:** Query performance, connection count, size
- **Auth:** Login attempts, user signups
- **Storage:** Bandwidth, object count
- **API:** Request volume, error rate

### 11.3 Custom Monitoring
- Health check endpoint: `/api/health`
- Automatic alerts for:
  - Error rate > 1%
  - API response time > 2s
  - Auth failure spike
  - Storage usage > 80%
