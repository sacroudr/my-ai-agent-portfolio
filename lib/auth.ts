// Admin authentication. Single source of truth for the admin session check —
// used by the middleware guard and by every admin data route.

import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_token";

/**
 * True only when an admin password is actually configured.
 * Everything else in this module refuses to authenticate when this is false.
 */
export function isAdminConfigured(): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return typeof password === "string" && password.length > 0;
}

/**
 * Validates an admin token against the configured password.
 *
 * Fails CLOSED. Without the isAdminConfigured() guard, a missing ADMIN_PASSWORD
 * makes `token?.value === process.env.ADMIN_PASSWORD` evaluate to
 * `undefined === undefined` — which is true, and would authenticate every
 * request that arrives with no cookie at all.
 */
export function isValidAdminToken(token: string | null | undefined): boolean {
  if (!isAdminConfigured()) return false;
  if (typeof token !== "string" || token.length === 0) return false;
  return token === process.env.ADMIN_PASSWORD;
}

/**
 * Reads the admin cookie from the incoming request and validates it.
 * For route handlers only — the middleware runtime has no next/headers, so
 * middleware calls isValidAdminToken() with the cookie it already holds.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
