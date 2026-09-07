# FVMS Flutter — Android (Coexist Web)

Flutter companion untuk FVMS web (Next.js). Fokus: Produksi/QC lapangan dengan offline-first.

## Stack
- **State:** flutter_bloc (BLoC)
- **Backend:** supabase_flutter (reuse DB/RLS/Storage web)
- **Local DB:** drift + sqlite3 (mirror Dexie offline)
- **Maps:** flutter_map OSM (offline tiles dipertimbangkan Fase 2)
- **Push:** firebase_messaging (FCM) + local_notifications
- **Nav:** go_router, Theme: brand emerald #10B981

## Setup
```bash
cd fvms_flutter
cp .env.example .env   # isi SUPABASE_URL & ANON_KEY dari web .env.local
flutter pub get
dart run build_runner build --delete-conflicting-outputs  # generate drift
flutterfire configure --project=FVMS_PROJECT_ID  # ganti firebase_options.dart
flutter run
```

## Coexist Rules
- Admin (master data, import, users) tetap di web.
- Flutter hanya jadwal/visit/laporan ringkas. RLS sama dengan web.
- Signing reuse SHA-256 DF:12:AE... & TWA_KEYSTORE_* di CI.

## CI
Workflow `.github/workflows/flutter.yml` (akan ditambah F1): analyze + test + apk/aab.

## Fase
F0 scaffold (done) -> F1 Auth+Shell -> F2 Read offline -> F3 Write offline -> F4 Dashboard/Reports -> F5 FCM
