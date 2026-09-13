# FVMS Flutter App — Comprehensive Audit Report

**Date:** 2026-09-14
**Scope:** Security, Performance, Code Quality, Offline Sync, Build/Dependencies, Tests
**Version:** v0.1.6 (commit fdaba36)

---

## Executive Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 1 | 7 | 5 |
| Performance | 5 | 10 | 6 | 2 |
| Code Quality | 0 | 4 | 5 | 3 |
| Offline Sync | 1 | 5 | 5 | 5 |
| Build/Dependencies | 3 | 3 | 3 | 2 |
| **TOTAL** | **10** | **23** | **26** | **17** |

**Estimated Test Coverage: < 3%** (3 trivial test files, zero unit/integration tests for any feature)

---

## CRITICAL Issues (Fix Immediately)

### C1. Release APK Signed with Debug Key
- **File:** `android/app/build.gradle.kts:33-38`
- **Impact:** Cannot publish to Play Store; any developer with debug keystore can overwrite app on user devices
- **Fix:** Configure proper release signing with dedicated keystore in CI secrets

### C2. String-Interpolated IN Clause — PostgREST Injection Risk
- **File:** `lib/core/supabase/scope.dart:10`
- **Code:** `query.filter('kabupaten_id', 'in', '(${scope.map((e) => '"$e"').join(',')})')`
- **Impact:** Double-quote in any value breaks the filter expression; applies to ALL scoped queries
- **Fix:** Use Supabase's built-in `.inFilter('column', listOfValues)` method

### C3. Schedules Page Doesn't Read from Local DB When Offline
- **File:** `lib/features/schedules/bloc/schedules_bloc.dart:161-191`
- **Impact:** Entire offline write infrastructure (Drift DB, outbox) is write-only; schedules page always fetches from server; users see error when offline despite local data existing
- **Fix:** Add fallback to read from `db.schedules` when `SyncBloc` reports offline

### C4. Outbox ID Collision — Timestamp-Based
- **File:** `lib/core/offline/engine.dart:130-131`
- **Code:** `id: Value(DateTime.now().millisecondsSinceEpoch.toString())`
- **Impact:** Two rapid writes generate same ID → primary key violation → silent write failure
- **Fix:** Use UUID v4 for outbox IDs

### C5. Firebase Options Are Placeholders — Push Notifications Non-Functional
- **File:** `lib/firebase_options.dart:11-16`
- **Impact:** FCM push notifications will never work; `Firebase.initializeApp` fails silently (caught in main.dart:26-27)
- **Fix:** Run `flutterfire configure` or implement proper Firebase setup

### C6. No CI/CD Pipeline for Flutter Project
- **Impact:** No automated build verification, no analyze/test in CI, no artifact generation
- **Fix:** Create `.github/workflows/flutter.yml`

### C7. Hydrate Overwrites Local Optimistic State
- **File:** `lib/core/offline/sync_bloc.dart:87-88`
- **Impact:** After pushOutbox succeeds, hydrateOffline overwrites local schedules with server data, reverting optimistic local updates until next push+hydrate cycle
- **Fix:** Preserve pending outbox mutations during hydration

### C8. Non-Lazy ListView for Schedules — All Cards Built Eagerly
- **File:** `lib/features/schedules/presentation/schedules_page.dart:39`
- **Impact:** For users with hundreds of schedules, ALL cards are built at once (not lazy), causing severe jank
- **Fix:** Use `ListView.builder` with flat list

### C9. Reports Page — 1500+ Widgets Built Eagerly
- **File:** `lib/features/reports/presentation/reports_page.dart:204,636-657`
- **Impact:** DataTable builds 100 rows × 15 cells = 1500+ widgets at once in a non-lazy ListView
- **Fix:** Use `ListView.builder` with sections

### C10. Sequential Photo Signed URL Fetching
- **File:** `lib/features/visits/bloc/visit_bloc.dart:237-252`
- **Impact:** Each photo's signed URL fetched sequentially; 10 photos = 10 sequential network calls of up to 8s each
- **Fix:** Use `Future.wait` with concurrency control

---

## HIGH Issues (Fix Soon)

### Security
| ID | Finding | File |
|----|---------|------|
| H1 | Raw error messages exposed to UI (SQL errors, table names) | `auth_bloc.dart:140`, `visit_page.dart:745` |
| H2 | Release build signed with debug key | `build.gradle.kts:33-38` |

### Performance
| ID | Finding | File |
|----|---------|------|
| H3 | No image caching/resizing — full-resolution decoded for thumbnails | `visit_page.dart:612,779` |
| H4 | No pagination in schedules — loads ALL rows at once | `schedules_bloc.dart:182` |
| H5 | Dashboard makes 3 sequential DB queries (should parallelize) | `dashboard_bloc.dart:92-96` |
| H6 | ReportsView — massive filter card rebuilt on every setState | `reports_page.dart:240-417` |
| H7 | FCM stream subscriptions never cancelled | `fcm_service.dart:12-13` |
| H8 | TextEditingController in reject dialog never disposed | `land_proposals_page.dart:517` |
| H9 | ReportsView mutates state inside build() — rebuild risk | `reports_page.dart:180-201` |
| H10 | FutureBuilder inside build() causes repeated network calls | `land_proposals_page.dart:448-487` |

### Code Quality
| ID | Finding | File |
|----|---------|------|
| H11 | `panenStatus` getter duplicated 3 times (panen_logic.dart unused) | `schedules_bloc.dart:56-66`, `visit_bloc.dart:77-87`, `reports_bloc.dart:97-106` |
| H12 | Status color/label mapping duplicated 6+ times | 6 files |
| H13 | `applyScope()` returns `dynamic` — propagates to every bloc | `scope.dart:3` |
| H14 | Unsafe casts: `m['status'] as String` in tight loop | `dashboard_bloc.dart:129-131` |

### Offline Sync
| ID | Finding | File |
|----|---------|------|
| H15 | Concurrent sync triggers can overlap (no BLoC transformer) | `sync_bloc.dart:50` |
| H16 | Empty migration stubs — schema upgrades will break | `db.dart:119-129` |
| H17 | No hydrate failure retry — stale data persists | `sync_bloc.dart:84-94` |
| H18 | Outbox entries never purged — unbounded growth | `engine.dart:87-94` |

### Build/Dependencies
| ID | Finding | File |
|----|---------|------|
| H19 | ~9 unused dependencies bloating the build | `pubspec.yaml` |
| H20 | Test coverage < 3% — zero real tests | `test/*.dart` |
| H21 | No ProGuard/R8 minification for release builds | `build.gradle.kts` |

---

## MEDIUM Issues (Fix Before Production)

| Category | Finding | File |
|----------|---------|------|
| Security | `debugPrint` leaks init errors | `main.dart:20-22` |
| Security | `ilike` with unescaped user input (wildcard injection) | `schedules_bloc.dart:197-203` |
| Security | No certificate pinning | (global) |
| Security | File extension-only type validation (no magic bytes) | `visit_bloc.dart:359-361` |
| Security | Arbitrary payload in land proposal insert | `land_proposal_bloc.dart:248-262` |
| Security | No network security configuration | `AndroidManifest.xml` |
| Security | Raw error strings stored in outbox | `engine.dart:88-93` |
| Performance | Duplicate `panenStatus` logic in 3 places | See H11 |
| Performance | Calendar full rebuilds on state change | `calendar_page.dart` |
| Performance | 200-row stats computed client-side instead of DB aggregation | `dashboard_bloc.dart:96` |
| Performance | Download memory spike (full image bytes in memory) | `visit_page.dart:720-751` |
| Code Quality | `ilike` filter with unescaped `%` and `_` | Multiple files |
| Code Quality | `dynamic` type propagation through query builders | `scope.dart`, all blocs |
| Code Quality | 15+ `catch (_) {}` blocks silently swallowing errors | Multiple files |
| Code Quality | Hardcoded color literals instead of brand tokens | `shell.dart:83,89,91` |
| Offline Sync | Full dataset held in memory during hydration | `engine.dart:29-74` |
| Offline Sync | Fragile `varietas` derivation from `document_no` | `engine.dart:62` |
| Build | Redundant `flutter_lints` alongside `very_good_analysis` | `pubspec.yaml:65-66` |
| Build | Bleeding-edge Gradle 9.3.1 / AGP 9.1.0 / Kotlin 2.4.0 | `settings.gradle.kts` |
| Build | `inference_failure_on_function_invoke` error globally suppressed | `analysis_options.yaml:8` |

---

## LOW Issues (Address When Possible)

| Category | Finding | File |
|----------|---------|------|
| Security | Firebase placeholder credentials tracked in git | `firebase_options.dart:11-16` |
| Security | Login error aids username enumeration | `auth_bloc.dart:125-127` |
| Security | HydratedBloc stores state in app directory | `main.dart:13-15` |
| Security | Photo download without content validation | `visit_page.dart:720-750` |
| Security | Photo delete without ownership check | `land_proposal_bloc.dart:364` |
| Security | No client-side auth rate limiting | `auth_bloc.dart:103-142` |
| Security | `WRITE_EXTERNAL_STORAGE` scoped correctly (acceptable) | `AndroidManifest.xml:7` |
| Performance | `_FullScreenPhoto` downloads full image into memory | `visit_page.dart:720-751` |
| Performance | ProfilePage missing `dispose()` override | `profile_page.dart` |
| Code Quality | `BrandGradientHero` widget never used | `brand_widgets.dart` |
| Code Quality | Hardcoded locale string array | `schedules_page.dart:109` |
| Code Quality | Inconsistent naming patterns | Multiple files |
| Offline Sync | Connectivity false positives (no real internet check) | `sync_bloc.dart:58` |
| Offline Sync | No batching of outbox replay | `engine.dart:83-95` |
| Offline Sync | No exponential backoff | `engine.dart`, `sync_bloc.dart` |
| Offline Sync | `clearAll()` is unconditionally destructive | `db.dart:132-141` |
| Offline Sync | `Connectivity()` instance potentially leaking | `sync_bloc.dart:62` |
| Build | `supabase_flutter` constraint too loose (`^2.8.1` → 2.17.2) | `pubspec.yaml:24` |
| Build | Missing `FOREGROUND_SERVICE_LOCATION` permission | `AndroidManifest.xml` |

---

## Priority Remediation Plan

### Phase 1: Critical Security & Stability (Week 1)
1. **C2:** Replace string-interpolated `.in` filter with `.inFilter()` in `scope.dart`
2. **C4:** Replace timestamp outbox IDs with UUIDs in `engine.dart`
3. **C3:** Add offline fallback read for schedules page
4. **H14:** Add null checks for unsafe casts in `dashboard_bloc.dart`
5. **H1:** Route all error messages through `sanitizeError()` consistently

### Phase 2: Build & Release (Week 2)
6. **C1:** Configure proper release signing in `build.gradle.kts`
7. **C6:** Create CI/CD pipeline with analyze + test + build
8. **C5:** Set up Firebase properly or remove Firebase dependency
9. **H21:** Enable R8 minification with proper ProGuard rules
10. **H19:** Remove unused dependencies from `pubspec.yaml`

### Phase 3: Performance (Week 3)
11. **C8:** Replace non-lazy ListView with `ListView.builder` for schedules
12. **C9:** Make reports DataTable lazy/paginated
13. **C10:** Parallelize photo signed URL fetching
14. **H3:** Add `cacheWidth`/`cacheHeight` to Image.network calls
15. **H4:** Add pagination to schedules query
16. **H5:** Parallelize dashboard DB queries

### Phase 4: Code Quality (Week 4)
17. **H11:** Centralize `panenStatus` logic, delete unused `panen_logic.dart`
18. **H12:** Centralize status color/label mapping
19. **H13:** Type the `applyScope()` function properly
20. **H15:** Add BLoC transformer to serialize sync events
21. **H16:** Implement proper Drift migration handlers

### Phase 5: Testing (Week 5-6)
22. **H20:** Write unit tests for all BLoCs
23. **H20:** Write widget tests for critical pages
24. **H20:** Write integration tests for auth + visit flow
25. Add `bloc_test` and `mocktail` usage to test files

---

## Appendix: Files Audited

- `lib/main.dart` — App entry, Supabase init
- `lib/core/supabase/client.dart` — Auth context, Supabase config
- `lib/core/supabase/scope.dart` — Query scoping
- `lib/core/offline/db.dart` — Drift database schema
- `lib/core/offline/engine.dart` — Sync engine
- `lib/core/offline/sync_bloc.dart` — Sync state management
- `lib/core/network/connectivity_cubit.dart` — Network detection
- `lib/core/push/fcm_service.dart` — Push notifications
- `lib/core/constants/status.dart` — Status definitions
- `lib/app/shell.dart` — Bottom navigation
- `lib/app/router.dart` — Route configuration
- `lib/app/theme/brand.dart` — Brand colors
- `lib/features/auth/bloc/auth_bloc.dart` — Auth logic
- `lib/features/auth/presentation/login_page.dart` — Login UI
- `lib/features/auth/presentation/profile_page.dart` — Profile UI
- `lib/features/schedules/bloc/schedules_bloc.dart` — Schedules logic
- `lib/features/schedules/presentation/schedules_page.dart` — Schedules UI
- `lib/features/schedules/presentation/calendar_page.dart` — Calendar UI
- `lib/features/schedules/presentation/filter_sheet.dart` — Filter UI
- `lib/features/visits/bloc/visit_bloc.dart` — Visit logic
- `lib/features/visits/presentation/visit_page.dart` — Visit UI
- `lib/features/reports/bloc/reports_bloc.dart` — Reports logic
- `lib/features/reports/presentation/reports_page.dart` — Reports UI
- `lib/features/dashboard/bloc/dashboard_bloc.dart` — Dashboard logic
- `lib/features/dashboard/presentation/dashboard_page.dart` — Dashboard UI
- `lib/features/land_proposals/bloc/land_proposal_bloc.dart` — Land proposal logic
- `lib/features/land_proposals/presentation/land_proposals_page.dart` — Land proposal UI
- `lib/features/notifications/bloc/notifications_bloc.dart` — Notifications logic
- `lib/features/panen/panen_logic.dart` — Panen status (UNUSED)
- `lib/widgets/shimmer.dart` — Shimmer widget
- `lib/widgets/brand_widgets.dart` — Brand widgets
- `android/app/build.gradle.kts` — Android build config
- `android/app/src/main/AndroidManifest.xml` — Android manifest
- `pubspec.yaml` — Dependencies
- `analysis_options.yaml` — Lint config
- `test/*.dart` — Test files
