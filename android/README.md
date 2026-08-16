# FVMS Android (TWA) — Build & Distribusi Tanpa Play Store

Aplikasi Android FVMS dibungkus sebagai **Trusted Web Activity (TWA)** yang membuka
PWA live di **https://fvms-eight.vercel.app** secara fullscreen. Artinya:

- Tidak perlu mendaftar ke Play Store untuk membagikan aplikasinya.
- Setiap perubahan web (fitur, fix, dsb) **otomatis tampil di aplikasi** karena TWA
  memuat URL Vercel secara langsung — tidak perlu rebuild tiap ada update web.
- Yang di-build hanyalah "cangkang" native (ikon, splash, trust) yang jarang berubah.
- Akses data programatik dari luar (mis. sistem pihak ketiga) dilakukan via REST API
  `/api/v1` (Bearer API key, role-scoped, CORS diaktifkan) — bukan dari dalam TWA.

| Item | Nilai |
|------|-------|
| Package ID | `id.sinapp.fvms` |
| Nama aplikasi | `FVMS` |
| Versi | `1.0.3` (versionCode `2`) — lihat `android/app/build.gradle` |
| Min/Target SDK | 21 / 36 |
| URL yang dibuka | `https://fvms-eight.vercel.app` |
| Metode distribusi | Sideload APK (tanpa Play Store) |

---

## 1. Build (otomatis via GitHub Actions)

Build dilakukan di CI — tidak butuh Android SDK di komputer lokal.
Workflow: **`.github/workflows/android.yml`** (job `Android TWA Release`).

Trigger:
- Manual: **Actions → Android TWA Release → Run workflow**.
- Atau push tag `android-*` (mis. `android-v1.0.4`).

Workflow akan:
1. Setup JDK 17 + Android SDK (platform 34/36, build-tools 34).
2. Siapkan keystore penandatangan:
   - Jika secret `TWA_KEYSTORE_B64` **ada** → pakai itu (fingerprint stabil).
   - Jika **kosong** → generate keystore baru (alias `upload`, password `fvms-upload-2026`).
3. Build `:app:assembleRelease` + `:app:bundleRelease` → menghasilkan **APK** & **AAB**.
4. Upload artifact:
   - `upload-keystore` — backup keystore (simpan baik-baik!).
   - `fvms-release-apk` — **ini yang disebar** (sideload).
   - `fvms-release-aab` — untuk Play Store (tidak dipakai di jalur sideload).
5. Hitung SHA-256 fingerprint, tulis ke `public/.well-known/assetlinks.json`,
   lalu **commit & deploy otomatis ke Vercel** → TWA jadi "trusted" (fullscreen, tanpa address bar).

---

## 2. Setup pertama kali (sekali saja)

1. **Jalankan workflow** `Android TWA Release` dengan secret `TWA_KEYSTORE_B64` **kosong**.
2. Setelah selesai, unduh 2 artifact:
   - `upload-keystore` → simpan di tempat aman (ini satu-satunya cara mempertahankan
     fingerprint yang sama di masa depan).
   - `fvms-release-apk` → APK yang akan diinstal ke HP.
3. **Set repo/org secrets** (Settings → Secrets → Actions) supaya run berikutnya pakai
   keystore yang SAMA:
   - `TWA_KEYSTORE_B64` = hasil `base64 -w0 upload.keystore`
   - `TWA_KEYSTORE_PASSWORD` = `fvms-upload-2026`
   - `TWA_KEY_ALIAS` = `upload`
4. **Verifikasi trust**: buka
   `https://fvms-eight.vercel.app/.well-known/assetlinks.json` — harus berisi JSON
   dengan `sha256_cert_fingerprints` yang sama dengan run summary.
5. **Sebarkan APK** (lihat langkah 3).

> ⚠️ Jangan jalankan workflow lagi tanpa mengisi `TWA_KEYSTORE_B64`. Jika dijalankan
> tanpa secret, keystore **baru** dibuat → fingerprint berubah → aplikasi yang sudah
> terpasang kehilangan trust (muncul address bar). Set secret dulu, lalu run.

---

## 3. Sideload ke HP (tanpa Play Store)

**Cara A — via file (WA / Drive / email):**
1. Kirim `app-release.apk` ke HP.
2. Di HP: **Setelan → Keamanan** (atau "Aplikasi & notifikasi") → aktifkan
   **"Sumber tak dikenal" / "Install aplikasi tidak dikenal"** untuk aplikasi pengirim
   (Chrome / Files / WA).
3. Buka file APK → **Instal**.

**Cara B — via ADB (kabel USB, debugging aktif):**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Setelah terpasang: ikon **FVMS** muncul di drawer, membuka situs fullscreen
(tanpa address bar bila `assetlinks.json` sudah匹配的).

---

## 4. Rilis versi baru

1. Naikkan `versionCode` (wajib beda tiap rilis) & `versionName` di
   `android/app/build.gradle`.
2. Commit & push, lalu jalankan workflow (dispatch, atau tag `android-vX`).
   Pastikan secret `TWA_KEYSTORE_B64` sudah terisi (lihat langkah 2).
3. Unduh `fvms-release-apk` terbaru, sebar ke HP (timpa instalasi lama).

Karena TWA memuat web live, **isi aplikasi ikut update otomatis** — rebuild APK
hanya perlu saat mengubah ikon/splash/versi/URL, atau mengganti keystore.

---

## 5. Trust & `assetlinks.json`

TWA menampilkan situs tanpa address bar hanya bila domain membuktikan kepemilikan
melalui **Digital Asset Links**: file `public/.well-known/assetlinks.json` berisi
SHA-256 certificate fingerprint dari keystore penandatangan APK.

- File ini **dibuat & di-commit otomatis oleh workflow** — jangan edit manual
  kecuali mengganti keystore.
- Bila muncul address bar setelah install: fingerprint di `assetlinks.json` tidak
  cocok dengan keystore yang mem-build APK (biasanya karena run ulang tanpa secret).
  Solusi: isi `TWA_KEYSTORE_B64`, run ulang, download APK baru, install ulang.

Format (`public/.well-known/assetlinks.json`):
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": { "namespace": "android_app", "package_name": "id.sinapp.fvms" },
  "sha256_cert_fingerprints": ["AB:CD:...:EF"]
}]
```

---

## 6. Keamanan

- **Jangan commit keystore** (`android/build/*.keystore`). Simpan artifact
  `upload-keystore` di penyimpanan aman.
- Siapa pun yang memegang keystore bisa menandatangani ulang APK dengan identity
  `id.sinapp.fvms` — jaga kerahasiaannya.
- Jika keystore hilang/terbocor: generate baru, perbarui `assetlinks.json`
  (otomatis di workflow), naikkan `versionCode`, rebuild & sebar ulang.

---

## 7. Build lokal (opsional, butuh Android SDK)

Hanya jika ingin build di mesin sendiri (bukan via CI):

```bash
# Butuh JDK 17 + Android SDK (platform 36, build-tools 34)
export TWA_KEYSTORE_PATH=$PWD/android/build/upload.keystore
export TWA_KEYSTORE_PASSWORD=fvms-upload-2026
export TWA_KEY_ALIAS=upload
# generate keystore bila belum ada:
keytool -genkeypair -v -keystore android/build/upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$TWA_KEYSTORE_PASSWORD" -keypass "$TWA_KEYSTORE_PASSWORD" \
  -dname "CN=FVMS, OU=TWA, O=Sin App, L=Jakarta, C=ID"

cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

Setelah build lokal, tulis SHA-256 ke `public/.well-known/assetlinks.json`
(`keytool -list -v -keystore ... -alias upload`) dan deploy ke Vercel.
