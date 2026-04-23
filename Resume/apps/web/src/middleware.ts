import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Content Security Policy (CSP)
  // Restricts where scripts, styles, and images can be loaded from.
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
  // Forces browsers to use HTTPS for 2 years.
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // 3. X-Content-Type-Options
  // Prevents MIME type sniffing (helps prevent certain XSS attacks).
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 4. X-Frame-Options
  // Prevents your site from being embedded in an iframe (prevents Clickjacking).
  response.headers.set("X-Frame-Options", "DENY");

  // 5. Referrer-Policy
  // Controls how much referrer information is passed to other sites.
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (api routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
