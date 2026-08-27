import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, isAdminConfigured, isValidAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  // Refuse to authenticate anyone when no password is configured. Otherwise a
  // request with no password at all would pass `undefined !== undefined`.
  if (!isAdminConfigured()) {
    console.error("[/api/admin/login] ADMIN_PASSWORD is not configured — refusing login");
    return new Response(JSON.stringify({ error: "Admin login is not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isValidAdminToken(password)) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, process.env.ADMIN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}