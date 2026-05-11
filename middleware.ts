import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin sub-routes — NOT /admin itself (the login page)
  const isProtected =
    pathname.startsWith("/admin/conversations") ||
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/usage");

  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("admin_token");
  const isAuthenticated = token?.value === process.env.ADMIN_PASSWORD;

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};