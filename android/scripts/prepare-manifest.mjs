import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const outDir = resolve(root, "android", "build");

const origin = process.env.TWA_ORIGIN?.replace(/^https?:\/\//, "") || "fvms-eight.vercel.app";
const packageName = process.env.TWA_ANDROID_PACKAGE || "id.sinapp.fvms";

const manifest = JSON.parse(readFileSync(resolve(root, "android", "twa-manifest.json"), "utf8"));
manifest.host = origin;
manifest.packageId = packageName;
manifest.webManifestUrl = `https://${origin}/manifest.json`;

let keystore;
try {
  keystore = process.env.TWA_KEYSTORE_B64
    ? Buffer.from(process.env.TWA_KEYSTORE_B64, "base64")
    : readFileSync(resolve(root, "android", "build", "upload.keystore"));
} catch {
  console.error(
    "Keystore tidak ditemukan.\n" +
      "- Di CI: workflow Android membuatnya otomatis.\n" +
      "- Manual: set env TWA_KEYSTORE_B64 atau buat via: keytool -genkeypair ... -keystore android/build/upload.keystore",
  );
  process.exit(1);
}

const keyAlias = process.env.TWA_KEY_ALIAS || "upload";
const aliasPassword = process.env.TWA_KEYSTORE_PASSWORD || "fvms-upload-2026";

writeFileSync(resolve(outDir, "upload.keystore"), keystore);
manifest.signingConfig = {
  path: resolve(outDir, "upload.keystore"),
  alias: keyAlias,
  keyPassword: aliasPassword,
  storePassword: aliasPassword,
};

mkdirSync(outDir, { recursive: true });
for (const icon of ["icon-512.png", "icon-maskable-512.png"]) {
  copyFileSync(resolve(root, "public", icon), resolve(outDir, icon));
}
writeFileSync(resolve(outDir, "twa-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`prepared android/build/twa-manifest.json -> https://${origin} (${packageName})`);