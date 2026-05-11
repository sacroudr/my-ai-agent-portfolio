import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/helpers";
import { chatSessions, chatMessages } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const sessions = await db
    .select({
      id: chatSessions.id,
      sessionId: chatSessions.sessionId,
      language: chatSessions.language,
      createdAt: chatSessions.createdAt,
    })
    .from(chatSessions)
    .orderBy(desc(chatSessions.createdAt));

  // For each session get message count and first user message
  const enriched = await Promise.all(
    sessions.map(async (session) => {
      const msgs = await db
        .select({
          content: chatMessages.content,
          role: chatMessages.role,
        })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, session.sessionId))
        .orderBy(chatMessages.createdAt);

      const firstMessage = msgs.find((m) => m.role === "user")?.content || "";

      return {
        ...session,
        messageCount: msgs.length,
        firstMessage: firstMessage.slice(0, 120),
      };
    })
  );

  return new Response(JSON.stringify(enriched), {
    headers: { "Content-Type": "application/json" },
  });
}