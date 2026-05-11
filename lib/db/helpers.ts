import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { chatSessions, chatMessages } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// -------------------------------------------------------------------
// SESSIONS
// -------------------------------------------------------------------

/**
 * Gets an existing session or creates a new one.
 * Called at the start of every API request.
 */
export async function getOrCreateSession(
  sessionId: string,
  language: "fr" | "en"
): Promise<void> {
  const existing = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(chatSessions).values({
      sessionId,
      language,
    });
  }
}

// -------------------------------------------------------------------
// MESSAGES
// -------------------------------------------------------------------

/**
 * Logs a single message (user or assistant) to chat_messages.
 */
export async function logMessage({
  sessionId,
  role,
  content,
  language,
  tokensUsed = 0,
}: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  language: "fr" | "en";
  tokensUsed?: number;
}): Promise<void> {
  await db.insert(chatMessages).values({
    sessionId,
    role,
    content,
    language,
    tokensUsed,
  });
}