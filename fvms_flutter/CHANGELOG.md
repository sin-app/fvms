# Changelog

All notable changes to FVMS Flutter will be documented in this file.

## [0.1.10] - 2026-09-16

### Fixed
- Removed `dotenv` dependency entirely from `SupabaseConfig` — only `--dart-define` supported
- `ThemeCubit` now extends `Cubit` instead of `HydratedCubit` (fixes `NotInitializedError` crash)
- Removed `hydrated_bloc` dependency and `HydratedStorage` init (no longer needed)
- `SupabaseConfig.url/anonKey` safe when dotenv not loaded
- `initSupabase()` no longer throws when unconfigured
- Error screen shows version number for debugging
- Error screen has manual copy button (no auto-copy)

### Added
- Status transition validation in `VisitBloc._status` (prevents invalid status changes)
- Authorization check in `LandProposalBloc._cancel` (only owner/admin can cancel)
- Timeout handlers in all `LandProposalBloc` action handlers
- `getAuthContext()` now rethrows `TimeoutException` and permission errors (no longer swallows)
- `sanitizeVarietas()` helper to prevent wildcard injection in filter queries
- `sanitizeError()` now handles permission denied/403/401 errors
- `FcmService` with proper cleanup (`dispose()` method)
- Pagination limit (500 rows) in `SchedulesBloc._load`
- `@visibleForTesting` annotation on `AppDatabase.forTesting`
- `CHANGELOG.md`

### Changed
- `_isSyncing` race condition fixed with `Completer` lock + `droppable()` transformer
- Removed `avoid_print` lint suppression in `db.dart`

## [0.1.9] - 2026-09-16

### Fixed
- `SupabaseConfig.url/anonKey` safe when dotenv not loaded (try-catch)
- `initSupabase()` no longer throws when unconfigured

## [0.1.8] - 2026-09-16

### Fixed
- Safe Firebase initialization (skip placeholder credentials)
- Safe PRAGMA WAL in Drift `beforeOpen`
- Safe `onUpgrade` migration in Drift database

## [0.1.7] - 2026-09-16

### Fixed
- UUID outbox IDs (replaces sequential IDs)
- `sanitizeError()` for user-friendly messages
- `_isSyncing` guard in `SyncBloc`
- `concurrent()` transformer for sync events
- Centralized panen logic (`panen_logic.dart`)
- Parallel photo signed URL fetching
- `ListView.builder` for schedules list
- `inFilter()` for Supabase IN clause queries
- Removed unused dependencies

## [0.1.6] - 2026-09-15

### Fixed
- Error boundary with copyable error display
- Error logging to `/storage/emulated/0/Download/fvms_error.log`
- Safe `HydratedStorage` initialization
- Error auto-copy to clipboard
