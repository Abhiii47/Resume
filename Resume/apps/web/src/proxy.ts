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
 * Handles routing boundaries and standard redirects.
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
