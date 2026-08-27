import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/auth";

// -------------------------------------------------------------------
// Rate limit rules — one sliding window per protected route.
// Each rule gets its OWN Upstash prefix so the budgets never overlap:
// exhausting the contact form must not lock a recruiter out of the chat.
// -------------------------------------------------------------------
const RATE_LIMIT_RULES = [
  {
    path: "/api/chat",
    limit: 10,
    window: "1 h" as const,
    prefix: "portfolio:ratelimit",
    copy: (limit: number, minutes: number, plural: string) => ({
      message: `You've reached the limit of ${limit} messages per hour. Please try again in ${minutes} minute${plural}.`,
      message_fr: `Vous avez atteint la limite de ${limit} messages par heure. Réessayez dans ${minutes} minute${plural}.`,
    }),
  },
  {
    path: "/api/contact",
    limit: 3,
    window: "1 h" as const,
    prefix: "portfolio:ratelimit:contact",
    copy: (limit: number, minutes: number, plural: string) => ({
      message: `You've reached the limit of ${limit} messages per hour. Please try again in ${minutes} minute${plural}.`,
      message_fr: `Vous avez atteint la limite de ${limit} messages par heure. Réessayez dans ${minutes} minute${plural}.`,
    }),
  },
  {
    path: "/api/admin/login",
    limit: 5,
    window: "15 m" as const,
    prefix: "portfolio:ratelimit:login",
    copy: (limit: number, minutes: number, plural: string) => ({
      message: `Too many login attempts (${limit} max). Please try again in ${minutes} minute${plural}.`,
      message_fr: `Trop de tentatives de connexion (${limit} max). Réessayez dans ${minutes} minute${plural}.`,
    }),
  },
];

// -------------------------------------------------------------------
// Rate limiters, keyed by path.
// Only initialized if Upstash credentials are present.
// -------------------------------------------------------------------
const ratelimiters = new Map<string, Ratelimit>();

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const redis = Redis.fromEnv();
    for (const rule of RATE_LIMIT_RULES) {
      ratelimiters.set(
        rule.path,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
          analytics: true,
          prefix: rule.prefix,
        })
      );
    }
  }
} catch (err) {
  console.error("[middleware] Failed to init rate limiter:", err);
  ratelimiters.clear();
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
    // isValidAdminToken fails closed when ADMIN_PASSWORD is unset — without
    // that guard a missing env var would authenticate cookie-less requests.
    if (!isValidAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------------
  // Rate limiting — applies to any path with a matching rule
  // -------------------------------------------------------------------
  const rule = RATE_LIMIT_RULES.find((r) => r.path === pathname);

  if (rule) {
    // Bypass rate limiting in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next();
    }

    // If the rate limiter isn't available (no creds, or Upstash down),
    // FAIL OPEN — allow the request rather than crashing the whole app.
    const ratelimit = ratelimiters.get(rule.path);
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
        const plural = minutesUntilReset > 1 ? "s" : "";

        return new Response(
          JSON.stringify({
            error: "rate_limit_exceeded",
            ...rule.copy(limit, minutesUntilReset, plural),
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
  matcher: ["/admin/:path*", "/api/chat", "/api/contact", "/api/admin/login"],
};