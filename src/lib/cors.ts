import { NextResponse } from "next/server";

const DEFAULT_ALLOWED = "*";

export const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Request-Id",
  "Access-Control-Max-Age": "86400",
} as const;

function allowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeadersFor(request: Request): Record<string, string> {
  const headers: Record<string, string> = { ...CORS_HEADERS };
  const allowed = allowedOrigins();
  const origin = request.headers.get("origin");

  if (allowed.includes("*")) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function preflightResponse(request: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeadersFor(request) });
}

export function withCors(request: Request, response: NextResponse): NextResponse {
  const headers = corsHeadersFor(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
