import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!await isAuthenticated()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Fetch sessions and all messages in parallel, then group in memory —
  // avoids N+1 queries (one extra SELECT per session).
  const [sessions, allMessages] = await Promise.all([
    db
      .select({
        id: chatSessions.id,
        sessionId: chatSessions.sessionId,
        language: chatSessions.language,
        createdAt: chatSessions.createdAt,
      })
      .from(chatSessions)
      .orderBy(desc(chatSessions.createdAt)),
    db
      .select({
        sessionId: chatMessages.sessionId,
        content: chatMessages.content,
        role: chatMessages.role,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .orderBy(chatMessages.createdAt),
  ]);

  // Group messages by sessionId (single pass)
  const messagesBySession = new Map<string, { content: string; role: string }[]>();
  for (const m of allMessages) {
    const list = messagesBySession.get(m.sessionId);
    if (list) {
      list.push({ content: m.content, role: m.role });
    } else {
      messagesBySession.set(m.sessionId, [{ content: m.content, role: m.role }]);
    }
  }

  const enriched = sessions.map((session) => {
    const msgs = messagesBySession.get(session.sessionId) ?? [];
    const firstMessage = msgs.find((m) => m.role === "user")?.content || "";
    return {
      ...session,
      messageCount: msgs.length,
      firstMessage: firstMessage.slice(0, 120),
    };
  });

  return new Response(JSON.stringify(enriched), {
    headers: { "Content-Type": "application/json" },
  });
}
