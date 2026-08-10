# Rilis Android (TWA / Trusted Web Activity)

FVMS didistribusikan sebagai **Trusted Web Activity** — aplikasi Android tipis yang
memuat web app (`https://fvms-eight.vercel.app`) di Chrome custom tab penuh layar,
tanpa rewrite. Persyaratan Google Play terpenuhi selama PWA memenuhi quality criteria
(sudah: HTTPS, manifest lengkap, ikon maskable, service worker).

## Alur release

1. Saat tag `android-*` di-push (atau via **Actions → Android TWA Release → Run workflow**),
   GitHub Actions:
   - menyiapkan JDK 17 + Android SDK,
   - membuat pasangan `upload.keystore` (jika secret belum ada) dan **meng-upload-nya sebagai
     artifact** → **WAJIB download & backup sekali** (tidak tersimpan di GitHub setelah ini),
   - membangun `AAB` via Bubblewrap → artifact `fvms-release-aab`,
   - mencetak **SHA-256 fingerprint** di halaman summary workflow.
2. Salin SHA-256 fingerprint ke environment variable Vercel:
   `TWA_SHA256_FINGERPRINT` (dan `TWA_ANDROID_PACKAGE` bila package beda).
   → Deploy ulang → route `/well-known/assetlinks.json` langsung valid.

## Secret yang dipakai workflow

| Secret | Wajib? | Keterangan |
|---|---|---|
| `TWA_ORIGIN` | opsional | domain TWA (default `fvms-eight.vercel.app`) — harus custom domain saat rilis resmi |
| `TWA_KEYSTORE_B64` | opsional | base64 dari `upload.keystore`; bila kosong, CI generate baru + artifact |
| `TWA_KEYSTORE_PASSWORD` | opsional | password keystore (default `fvms-upload-2026` — ganti bila pakai secret) |
| `TWA_KEY_ALIAS` | opsional | alias key (default `upload`) |

> Jika memakai keystore sendiri: set `TWA_KEYSTORE_B64` + password + alias, dan pastikan
> SHA-256 fingerprint di assetlinks cocok dengan CERTIFICATE tersebut.

## Environment variable aplikasi (Vercel)

| Variable | Nilai |
|---|---|
| `TWA_SHA256_FINGERPRINT` | SHA-256 cert upload key (dari summary workflow) |
| `TWA_ANDROID_PACKAGE` | `id.sinapp.fvms` (default) |

Route `/well-known/assetlinks.json` dibaca Google Play saat verifikasi TWA. Geser nilainya
via env — tanpa env, nilai `PENDING_...` membuat validasi gagal.

## Publikasi ke Play Console

1. Buat akun developer Google Play (biaya sekali US$25) & login Play Console.
2. *Create app* — name `FVMS`, package `id.sinapp.fvms` (harus sama dengan env).
3. Upload AAB dari artifact workflow di *Testing > Internal testing*.
4. Daftarkan **Digital Asset Links** otomatis — Play memvalidasi
   `https://<domain>/.well-known/assetlinks.json`.
5. Isi formulir data safety, privacy policy (link ke kebijakan privasi Anda), gunakan
   **Google Play App Signing** bila ingin Play mengelola kunci.
6. Naikkan ke *Closed/Open testing* → *Production*.

## Update versi aplikasi

- Naikkan `appVersionName` / `appVersionCode` di `android/twa-manifest.json`,
  lalu tag baru `android-vX.Y.Z` → workflow jalan → upload AAB baru.

## Catatan

- **Custom domain sangat disarankan** sebelum rilis production (`app.fvms.id` dst.):
  vercel.app boleh dipakai untuk testing internal.
- TWA tetap butuh koneksi internet. Fitur **offline-first** (isi kunjungan & sinkron)
  dikerjakan terpisah di roadmap berikutnya (lihat AGENTS.md).
- Keystore hilang = tidak bisa update app di Play. Backup artifact `upload-keystore`.