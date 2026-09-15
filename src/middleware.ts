import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Edge-level first filter for the portal area: checks only that a session
 * cookie is PRESENT and redirects anonymous visitors to login, preserving
 * their destination in `?next=`. It deliberately does NOT verify the session
 * against the database (prisma is not edge-runtime safe) — real verification
 * happens in the portal layout and in every API route. Defense in depth.
 */
export function middleware(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/announcements/:path*"],
};
