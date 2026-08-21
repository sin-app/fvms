#!/usr/bin/env bash
# Local Android TWA build helper (requires Android SDK + JDK 17 on PATH).
# Provide your keystore via env, or a debug keystore is generated automatically.
set -euo pipefail
cd "$(dirname "$0")/.."

KEYSTORE="${TWA_KEYSTORE_PATH:-android/build/upload.keystore}"
PASSWORD="${TWA_KEYSTORE_PASSWORD:-fvms-upload-2026}"
ALIAS="${TWA_KEY_ALIAS:-upload}"

mkdir -p android/build
if [ ! -f "$KEYSTORE" ]; then
  echo "Generating keystore at $KEYSTORE"
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASSWORD" -keypass "$PASSWORD" \
    -dname "CN=FVMS, OU=TWA, O=Sin App, L=Jakarta, C=ID"
fi

export TWA_KEYSTORE_PATH="$KEYSTORE"
export TWA_KEYSTORE_PASSWORD="$PASSWORD"
export TWA_KEY_ALIAS="$ALIAS"

# Versi otomatis: code = jumlah commit, name = tag android-* terbaru
CODE=$(git rev-list --count HEAD)
TAG=$(git describe --tags --match 'android-*' --abbrev=0 2>/dev/null | sed 's/^android-//' || true)
NAME="${TAG:-1.0.0}"
echo "Building Android app version $NAME (code $CODE)"

cd android
./gradlew --no-daemon --console=plain :app:assembleRelease :app:bundleRelease \
  -PappVersionCode="$CODE" \
  -PappVersionName="$NAME"

echo ""
echo "APK -> android/app/build/outputs/apk/release/"
echo "AAB -> android/app/build/outputs/bundle/release/"
echo ""
echo "For TWA trust, compute the SHA-256 fingerprint of the keystore and put it in"
echo "public/.well-known/assetlinks.json, then deploy. (The 'Android TWA Release' GitHub"
echo "Actions workflow does this automatically.)"
