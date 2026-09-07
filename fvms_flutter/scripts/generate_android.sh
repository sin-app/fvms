#!/usr/bin/env bash
set -e
# Generate android/ folder for fvms_flutter (coexist, tidak ganggu web android/)
# Jalankan sekali setelah flutter terinstall:
#   cd fvms_flutter && bash scripts/generate_android.sh

if ! command -v flutter &>/dev/null; then
  echo "flutter tidak ditemukan. Install flutter stable dulu."
  exit 1
fi

echo "Generating android/ via flutter create..."
flutter create . --platforms=android --project-name fvms_flutter --org id.sinapp.fvms

echo "Patch signing: reuse TWA keystore jika ada"
if [ -n "$TWA_KEYSTORE_B64" ]; then
  echo "Keystore dari env TWA_KEYSTORE_B64 tersedia - ci akan decode ke android/app/fvms.keystore"
fi

echo "Selesai. Lanjut: flutter pub get && dart run build_runner build"
