import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// -------------------------------------------------------------------
// Rate limiter — 10 requests per hour per IP
// Only initialized if Upstash credentials are present.
// -------------------------------------------------------------------
let ratelimit: Ratelimit | null = null;

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "portfolio:ratelimit",
    });
  }
} catch (err) {
  console.error("[middleware] Failed to init rate limiter:", err);
  ratelimit = null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // -------------------------------------------------------------------
  // Admin protection — redirect to login if no valid cookie
  // -------------------------------------------------------------------
  const isProtected =
    pathname.startsWith("/admin/conversations") ||
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/usage");

  if (isProtected) {
    const token = req.cookies.get("admin_token");
    const isAuthenticated = token?.value === process.env.ADMIN_PASSWORD;
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------------
  // Rate limiting — only applies to /api/chat
  // -------------------------------------------------------------------
  if (pathname === "/api/chat") {
    // Bypass rate limiting in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    // If the rate limiter isn't available (no creds, or Upstash down),
    // FAIL OPEN — allow the request rather than crashing the whole app.
    if (!ratelimit) {
      return NextResponse.next();
    }

    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";

      const { success, limit, remaining, reset } = await ratelimit.limit(ip);

      if (!success) {
        const resetDate = new Date(reset);
        const minutesUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 60000);

        return new Response(
          JSON.stringify({
            error: "rate_limit_exceeded",
            message: `You've reached the limit of ${limit} messages per hour. Please try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? "s" : ""}.`,
            message_fr: `Vous avez atteint la limite de ${limit} messages par heure. Réessayez dans ${minutesUntilReset} minute${minutesUntilReset > 1 ? "s" : ""}.`,
            reset: reset,
            remaining: 0,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(reset),
              "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", String(limit));
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set("X-RateLimit-Reset", String(reset));
      return response;
    } catch (err) {
      // Upstash unreachable (e.g. archived DB) — FAIL OPEN.
      // The chat must keep working even if rate limiting is down.
      console.error("[middleware] Rate limit check failed, allowing request:", err);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/chat"],
};