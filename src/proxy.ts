import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";
import { withRequestId } from "@/lib/logger";

const PUBLIC_ROUTES = ["/login", "/reset-password"];
const AUTH_ROUTES = ["/login"];

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

  return withRequestId(requestId, async () => {
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applyCookiesToResponse(request, redirectResponse, cookiesToSet);
    return redirectResponse;
  }

  if (session && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const dashboardResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    applyCookiesToResponse(request, dashboardResponse, cookiesToSet);
    return dashboardResponse;
  }

  const response = NextResponse.next({ request });
  applyCookiesToResponse(request, response, cookiesToSet);
  response.headers.set("x-request-id", requestId);
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
    response.cookies.set(name, value, options);
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default middleware;
