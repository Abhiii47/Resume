import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/resume",
  "/analysis",
  "/jobs",
  "/applications",
  "/roadmap",
  "/interview",
];

/**
 * Next.js 16 Proxy convention (formerly middleware)
 * Handles routing boundaries, standard redirects, and security headers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // better-auth sets a session cookie; check for its presence
    const sessionToken =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("__session");

    if (!sessionToken) {
      console.log(
        `[Proxy] Unauthorized access to ${pathname}. Redirecting to /login`,
      );
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // ─── Security Headers ──────────────────────────────────────────────────────

  // 1. Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: https://*.googleusercontent.com https://*.supabase.co;
    connect-src 'self' https://*.supabase.co https://api.yepapi.com https://api.resend.com https://api.stripe.com;
    frame-ancestors 'none';
    form-action 'self';
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // 2. Strict-Transport-Security (HSTS)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // 3. X-Content-Type-Options
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 4. X-Frame-Options
  response.headers.set("X-Frame-Options", "DENY");

  // 5. Referrer-Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
