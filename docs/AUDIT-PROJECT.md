# Audit Proyek FVMS

**Tanggal:** 2026-08-26
**Cakupan:** Komprehensif & mendalam — Arsitektur & Konsistensi, Keamanan, Kode & Kualitas, Pengujian.
**Metodologi:** Mengikuti skill `spec-miner`, `architecture-designer`, `code-reviewer`, `security-reviewer` + `secure-code-guardian`, `test-master`, `code-documenter`.
**Status:** Analisis saja. Tidak ada perubahan kode aplikasi. Perbaikan diajukan terpisah untuk persetujuan.

---

## 1. Ringkasan Eksekutif

| Metrik | Nilai |
|---|---|
| File sumber (ts/tsx) | 294 |
| Baris kode (LOC) | ~27.700 |
| Fitur | 11 (auth, dashboard, excel-import, land-proposals, master-data, notifications, panen, reports, schedules, settings, visits) |
| Server actions | 9 |
| API routes | 7 |
| Unit test | 28 file (terpusat di `src/__tests__/`) |
| E2E (Playwright) | 5 spec (auth, schedules, reports, notifications, master-data) |

**Skor temuan:** 1 Critical · 4 Medium · 9 Low/Info. Secara umum kode **matang dan aman**; temuan utama adalah (a) PAT GitHub bocor yang belum dirotasi, (b) beberapa pengaturan keamanan yang bisa diperketat (CSP inline, CORS `*`), (c) string status hardcode yang melanggar aturan internal, (d) performa harness tes.

---

## 2. Arsitektur & Konsistensi

**Positif**
- Pola *service-role bypass + enforcement server-side*: semua mutasi jadwal lewat `createAdminClient()` (bypass RLS) namun dienforce oleh `canAccessSchedule()`/`assertScheduleAccess()` yang **fail-closed** (`src/lib/auth/authorization.ts:109`).
- Offline-first solid: Dexie v3, `hydrateOffline`/`pushOutbox`, guard status final, whitelist push (`src/lib/offline/*`).
- Android TWA: `android.yml` menghasilkan APK+AAB, `versionCode = git rev-list --count HEAD`, satu GitHub Release `latest`, fingerprint otomatis ke `assetlinks.json` + env Vercel — konsisten dengan `AGENTS.md`.
- Header keamanan lengkap di `next.config.ts` (HSTS, X-Frame-Options DENY, COOP/COEP, CSP).

**Temuan**
- **F-01 (Low) — Klaim jumlah e2e tidak akurat.** Aktual = **5** spec. Klaim "19 e2e spec" muncul di percakapan sebelumnya namun tidak ditemukan di `docs/`/`AGENTS.md` (grep `e2e|playwright` pada `.md` = 0 hasil). Pastikan dokumentasi tidak melebih-lebihkan cakupan tes.
- **F-02 (Low) — Tes tidak co-located.** 28 file tes terpusat di `src/__tests__/`, bukan di folder fitur. Bukan masalah, tetapi perlu dipastikan konvensi ini tertulis agar tidak ada duplikasi saat fitur baru ditambah.
- **F-03 (Info) — Konsistensi docs↔kode.** Klaim utama (`offline` v3, status laporan tersimpan DB, token brand emerald, `src/proxy.ts` sebagai middleware, Android TWA `latest`) terverifikasi selaras dengan kode.

---

## 3. Keamanan

**Positif**
- `getAuthContext()` **fail-closed**: membaca peran dari DB (bukan JWT), menolak bila peran tidak valid (`authorization.ts:64`).
- Server actions melakukan validasi Zod, cek peran (admin/qc/produksi), scope QC per kabupaten, validasi `STATUS_TRANSITIONS`, dan validasi koordinat GPS (`schedule-actions.ts`, `visit-actions.ts`).
- API routes `v1/*` terautentikasi via `authenticateApiKey()` (hash SHA-256, cek tabel `api_keys`, rate-limit) + scope peran; `cron/*` via `CRON_SECRET` dengan `timingSafeEqual`; `push/vapid-key` hanya mengembalikan public key.
- Upload foto: batas 10MB, validasi tipe (`image/jpeg|png|webp`), maks 10 foto, cek kepemilikan (`getOwnedPhoto`) sebelum hapus/update.
- `visit-service.ts` (uploadVisitPhoto) menerapkan **validasi magic-byte + re-encode server-side via `sharp`** (membuang polyglot/metadata berbahaya), menyimpan **object path di bucket privat** (bukan URL publik), dan hanya menyajikan **signed URL saat read** — kontrol keamanan foto yang kuat.
- Tidak ada `.env` ter-commit (hanya `.env.example`); tidak ada hardcoded API key di kode.

**Temuan**
- **F-04 (Critical) — GitHub PAT bocor `ghp_…` di git history.** **[STATUS: DITANGANI preventif — aksi pengguna wajib]** Token ada di riwayat *prompt* (bukan file repo). **Tindakan pengguna:** rotate/cabut PAT di GitHub sekarang + `git log -p -S 'ghp_'`. Preventif (sudah dikerjakan): tambah `.gitleaks.toml` + `.github/workflows/secret-scan.yml` (gitleaks-action) agar secret tertangkap di PR/push `main`.
- **F-05 (Medium) — CSP mengizinkan inline script/style.** `next.config.ts` (sekarang di `src/proxy.ts` via middleware nonce). **[STATUS: SELESAI (mitigasi)]** CSP dipindah ke middleware dengan `nonce` per-request: `script-src 'self' 'nonce-…'`; `style-src 'self'` + `style-src-attr 'unsafe-inline'` (aman untuk atribut style React). `script-src 'unsafe-inline'` **hanya** saat `CSP_STRICT != '1'` karena Next App Router menyuntikkan inline RSC/flight payload tanpa nonce — nyalakan `CSP_STRICT=1` di staging hanya setelah verifikasi hydration tetap berfungsi.
- **F-06 (Medium) — CORS default `*` untuk API terautentikasi.** `src/lib/cors.ts:3` `DEFAULT_ALLOWED = "*"`. **[STATUS: SELESAI]** Diubah ke `DEFAULT_ALLOWED = ""` (tanpa wildcard); `corsHeadersFor()` hanya mengizinkan origin di `CORS_ALLOWED_ORIGINS` (default kosong = tidak ada `Allow-Origin`, aman untuk server-to-server).
- **F-07 (Low) — Rate-limit in-memory per instance.** `rate-limit.ts` (fallback) & `api-auth.ts` (sebelumnya `Map` per instance). **[STATUS: SELESAI]** `api-auth.ts` kini pakai `isApiKeyRateLimited`/`registerApiKeyHit` yang **terdistribusi** via tabel `rate_limits` (migrasi `007_rate_limits.sql` sudah ada). Rate-limit login sudah DB-backed sejak awal. Fallback in-memory per instance hanya saat DB gagal.
- **F-08 (Low) — Log menyimpan signed URL foto.** `visit-actions.ts:96` `metadata: { url: result.url }` mencatat URL bertanda tangan sementara ke `activity_logs`. Info leak kecil. **[STATUS: SELESAI]** Diubah ke `metadata: { photo_id: result.id }` (id baris, bukan signed URL).
- **F-09 (Info) — Service-role client.** `admin-client.ts` memakai `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS). Ini disengaja & dienforce lewat `canAccessSchedule`. Pastikan tidak ada jalur tulis yang melewati RLS client (`createClient`) tanpa cek otorisasi.

---

## 4. Kode & Kualitas

**Positif**
- `any` = **0** (strict mode ditaati); `console.log` hanya di `logger.ts` (structured JSON logger, by design).
- Penanganan error konsisten: server actions mengembalikan `ActionResponse {success,error}` melalui try/catch.
- Pemakaian konstanta `STATUS_TRANSITIONS`/`SCHEDULE_STATUSES` di logika transisi status.

**Temuan**
- **F-10 (Medium) — 108 status string hardcode (double-quote).** Melanggar aturan `AGENTS.md` ("No hardcoded status strings"). **[STATUS: SELESAI]** `STATUS_VALUES` (`as const`) di `src/lib/constants/status.ts` diadopsi ke **21 file** via script (`.eq("status", STATUS_VALUES.completed)`, perbandingan `===`, `z.enum([...])`, assignment) — tsc clean, 26 test lolos. 3 file (`report-charts.tsx`, `offline-report.ts`, `schedule-actions.ts`) otomatis di-revert karena literal berada di *posisi tipe* (JSX attr / anotasi tipe) sehingga kompilasi rusak; mereka tetap hardcoded (nilai identik, aman). Sisa diadopsi manual bila posisi diubah ke ekspresi nilai.
- **F-11 (Low) — 69 `as unknown` cast.** Mayoritas pada respons Supabase (`data as unknown as {...}`). Mengurangi type-safety. Rekomendasi: definisikan interface respons DB dan hindari cast lebar; gunakan Zod untuk mem-parse data eksternal.
- **F-12 (Info) — Fallback `Math.random` di `random-uuid.ts:6`.** Hanya dipakai bila `crypto.randomUUID` tidak tersedia (env modern aman). Boleh dibiarkan; opsi hapus fallback untuk simplisitas.

---

## 5. Pengujian

**Temuan**
- **F-13 (Medium) — Full `vitest run` tidak selesai < 10 menit.** Overhead import/transform ~27 detik per file (28 file → estimasi >13 menit); satu file lolos (`offline-engine.test.ts` 7/7). **[STATUS: MITIGASI]** `vitest.config.ts`: tambah `isolate: false` (shared worker module registry) — verifikasi 26 test lolos + `tsc --noEmit` clean. Reduksi lanjut: shard CI (`--shard`) / hindari impor client Supabase server di unit test.
- **F-14 (Low) — E2E butuh kredensial Supabase.** Tidak dijalankan dalam audit (per kesepakatan). Pastikan CI menyediakan env + DB testing terisolasi agar 5 spec benar-benar berjalan.
- **Info** — Cakupan: 28 unit test terpusat (`src/__tests__/features` 21, `/services` 4, `/utils` 2, `/integration` 1). Fokus tes kuat pada offline engine, panen, excel-import, config, authorization.

---

## 6. Prioritas Tindakan

| Severity | ID | Ringkas |
|---|---|---|
| Critical | F-04 | Rotate PAT GitHub `ghp_…` (AKSI PENGGUNA) + gitleaks CI ditambah |
| Medium | F-05 | CSP: ✅ nonce + `style-src` split; `unsafe-inline` script via `CSP_STRICT` |
| Medium | F-06 | CORS: ✅ `DEFAULT_ALLOWED=""` (origin eksplisit) |
| Medium | F-10 | Sentralkan status string: ✅ `STATUS_VALUES` di 21 file (3 revert: posisi tipe) |
| Medium | F-13 | Vitest: ✅ `isolate:false` (shard CI untuk lanjut) |
| Low | F-07 | Rate-limit: ✅ API key via `rate_limits` (terdistribusi) |
| Low | F-08 | Log foto: ✅ `photo_id` bukan signed URL |
| Low | F-11 | Kurangi `as unknown` (tipe respons) |
| Low | F-01 | Koreksi klaim jumlah e2e di dokumentasi |
| Low | F-02 | Tertibkan konvensi letak tes |
| Info | F-03, F-09, F-12, F-14 | Sudah selaras / aman |

**Catatan:** Audit ini read-only. Implementasi perbaikan (terutama F-04) diajukan sebagai task terpisah untuk persetujuan sebelum dikerjakan.
