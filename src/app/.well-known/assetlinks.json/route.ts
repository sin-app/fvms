import { NextResponse } from "next/server";

const DEFAULT_PACKAGE = "id.sinapp.fvms";
const DEFAULT_SHA = "PENDING_SET_AFTER_UPLOAD_KEY_GENERATED";

export const dynamic = "force-dynamic";

export function GET() {
  const packageName = process.env.TWA_ANDROID_PACKAGE ?? DEFAULT_PACKAGE;
  const fingerprint = process.env.TWA_SHA256_FINGERPRINT ?? DEFAULT_SHA;
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: packageName,
          sha256_cert_fingerprints: [fingerprint],
        },
      },
    ],
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
  );
}