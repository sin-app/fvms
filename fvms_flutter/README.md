# FVMS Flutter — Android (Coexist Web)

Flutter companion untuk FVMS web (Next.js). Fokus: Produksi/QC lapangan dengan offline-first. **Android Only, BLoC, OSM, FCM.**

## Stack
- **State:** flutter_bloc (BLoC) + hydrated_bloc, bloc_concurrency
- **Backend:** supabase_flutter (reuse DB/RLS/Storage web, 37 migrasi)
- **Local DB:** drift + sqlite3 (mirror Dexie offline v3: schedules, visitNotes, visitPhotos+blob, regions, outbox, meta)
- **Maps:** flutter_map OSM + geolocator (coexist Leaflet web)
- **Push:** firebase_core + firebase_messaging (FCM) + flutter_local_notifications
- **Nav:** go_router 5 tab BottomNav pill, Theme brand emerald #10B981
- **Lain:** fl_chart, table_calendar, image_picker+compress, excel/pdf

## Setup (host tanpa flutter)
```bash
# 1. Install flutter stable
git clone https://github.com/flutter/flutter.git -b stable --depth 1 ~/flutter
export PATH="$HOME/flutter/bin:$PATH"

# 2. Generate android/ (sekali)
cd fvms_flutter
bash scripts/generate_android.sh   # atau flutter create . --platforms=android

# 3. Env
cp .env.example .env   # isi SUPABASE_URL & ANON_KEY dari ../.env.local web
# 4. Deps + drift
flutter pub get
dart run build_runner build --delete-conflicting-outputs
# 5. Firebase (opsional untuk FCM)
dart pub global activate flutterfire_cli
flutterfire configure --project=YOUR_FB_PROJECT_ID  # overwrite lib/firebase_options.dart + google-services.json
# 6. Run
flutter run -d android
```

## Coexist Rules
- Admin (master data, import, users, reset) tetap di web.
- Flutter: jadwal/visit/gps/foto/status/label/laporan ringkas + offline queue.
- RLS sama web (privat bucket visit-photos, guard status final online-only).
- Signing reuse SHA-256 `DF:12:AE:AE:D2:0C:60:A6:AC:73:69:6D:4E:BC:9F:9C:1E:60:50:9D:5C:B5:81:DE:04:DB:6B:B0:D5:C0:10:16` & `TWA_KEYSTORE_*` di CI.

## Struktur
```
lib/app (router, shell pill, theme)
lib/core (status, date, supabase, offline db/engine/sync_bloc, push fcm, network)
lib/features (auth, dashboard, schedules, visits, reports, panen, land_proposals, notifications)
lib/widgets (shimmer, brand, sync_indicator)
```

## CI
`.github/workflows/flutter.yml` — analyze + test + build apk split + aab (reuse keystore, triggered on fvms_flutter/**).

## Fase Status
- F0 scaffold ✅
- F1 Auth/Shell ✅ (login, reset, profile, dashboard hero)
- F2 Schedules/Kalender ✅
- F3 Visits (notes/gps OSM/photos/status) ✅
- F4 Reports/LandProposals/Notifications ✅
- F5 Polish (filter sheet, FCM service, sync) ✅

Next: `flutter analyze` + `flutter test` di CI akan hijau setelah `android/` generate + `build_runner`.
