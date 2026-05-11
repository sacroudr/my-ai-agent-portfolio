import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/helpers";
import { chatMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!await isAuthenticated()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { sessionId } = await params;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return new Response(JSON.stringify(messages), {
    headers: { "Content-Type": "application/json" },
  });
}