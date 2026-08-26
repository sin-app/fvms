import { type NextRequest, NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { createServerClient } from "@supabase/ssr";
import { randomUUID, randomBytes } from "node:crypto";
import { withRequestId } from "@/lib/logger";

const PUBLIC_ROUTES = ["/login", "/reset-password"];
const AUTH_ROUTES = ["/login"];
const SESSIONLESS_API = ["/api/cron", "/api/v1", "/ready"];

/** Cocokkan path persis atau sebagai prefix route ("/login/x" -> "/login"). */
function routeMatches(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  const nonce = randomBytes(16).toString("base64");
  const cspStrict = process.env.CSP_STRICT === "1";
  const applyCsp = (res: NextResponse) =>
    res.headers.set("Content-Security-Policy", buildCsp(nonce, cspStrict));

  return withRequestId(requestId, async () => {
  const isPublicRoute = routeMatches(pathname, PUBLIC_ROUTES);
  const isSessionlessApi = routeMatches(pathname, SESSIONLESS_API);

  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  if (isSessionlessApi) {
    const response = NextResponse.next({ request });
    response.headers.set("x-request-id", requestId);
    applyCsp(response);
    return response;
  }

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applyCookiesToResponse(request, redirectResponse, cookiesToSet);
    applyCsp(redirectResponse);
    return redirectResponse;
  }

  if (user && routeMatches(pathname, AUTH_ROUTES)) {
    const dashboardResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applyCookiesToResponse(request, dashboardResponse, cookiesToSet);
    applyCsp(dashboardResponse);
    return dashboardResponse;
  }

  const response = NextResponse.next({ request });
  applyCookiesToResponse(request, response, cookiesToSet);
  response.headers.set("x-request-id", requestId);
  applyCsp(response);
  return response;
  });
}

function applyCookiesToResponse(
  request: NextRequest,
  response: NextResponse,
  cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    request.cookies.set(name, value);
    response.cookies.set(name, value, options as Partial<ResponseCookie> | undefined);
  });
}

function buildCsp(nonce: string, strict: boolean): string {
  // `script-src 'unsafe-inline'` diperlukan oleh Next App Router untuk inline
  // RSC/flight payload — tidak ada nonce otomatis dari framework. Mode strict
  // (CSP_STRICT=1) menghapusnya untuk environment yang sudah memverifikasi
  // hydration tetap berfungsi (mis. via nonce pada script buatan sendiri).
  const scriptSrc = `'self' 'nonce-${nonce}'${strict ? "" : " 'unsafe-inline'"}`;
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Stylesheet di-load via <link> memakai nonce (sama dengan script). Tanpa
    // nonce di style-src, browser memblokir CSS -> halaman tampil tanpa style
    // (putih). unsafe-inline untuk <style> injeksi library (aman: tidak bisa
    // mengeksekusi script).
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://*.openstreetmap.org",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|health|sw\\.js|\\.well-known|manifest\\.json|swe-worker.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default middleware;
