name: flutter-fullstack
description: Use when building FVMS Flutter + Next.js fullstack — Flutter BLoC, Drift, Supabase, go_router, flutter_map OSM, FCM, plus Next.js App Router, RLS, offline sync. Triggers on "flutter", "FVMS", "supabase", "drift", "bloc", "audit", "login", "APK".
---

# Flutter Fullstack — FVMS

## Stack FVMS
- Web: Next.js 16 App Router, Supabase (RLS, Storage private), TanStack Query, Dexie offline, Vercel
- Flutter: BLoC, Drift (offline v3), supabase_flutter, go_router, flutter_map OSM, firebase_messaging FCM, hydrated_bloc
- Brand: emerald #10B981, BottomNav pill 5 tab, shimmer, analyze 0 issues

## Rules
1. **Coexist:** Web untuk Admin (Import/Master Data), Flutter untuk Produksi/QC lapangan. Single Supabase backend (37 migrasi).
2. **Supabase:** Selalu `isSupabaseInitialized` + `isConfigured` guard + `.timeout(10s)` + `String.fromEnvironment` via `--dart-define` (CI). Jangan `env` untuk release.
3. **Offline:** Drift `schedules` denormalized `*_name` + `outbox` whitelist `status,label,lat/lng` + guard status final online-only. Dexie v3 mirror.
4. **BLoC:** `event: Load/Filter`, `state: Loading/Loaded/Error`, `Future.any` timeout, `Equatable`.
5. **Maps:** OSM `flutter_map` + `geolocator`, compileSdk 36, desugaring `2.1.4`.
6. **Analyze 0:** `dart fix --apply`, `analysis_options.yaml` lenient untuk `info` non-kritis, `flutter analyze --no-fatal-infos` di CI.
7. **CI:** `node 22`, `eslint --max-warnings=0`, `flutter test 4/4`, `health-monitor` tiap 30m.

## Verify
- Web: `npm run typecheck && npx eslint --max-warnings=0 . && npm run test`
- Flutter: `flutter analyze && flutter test && dart fix --dry-run`
- Build: `flutter build apk --release --split-per-abi --dart-define=SUPABASE_*` + `appbundle`

## Login Checklist (akbar@fvms.com)
- Supabase `dcfaual...` (sin-app) anon `xNJMJ...`, `supabase.auth.signIn` 200 OK, `public.users` RLS qc scope
- APK harus built dengan `--dart-define` (bukan env), `SupabaseConfig.isConfigured` true, tidak ada banner merah
