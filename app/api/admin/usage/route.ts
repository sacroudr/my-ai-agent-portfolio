import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/helpers";
import { chatSessions, chatMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === process.env.ADMIN_PASSWORD;
}

// Claude Haiku pricing (per 1k tokens)
const COST_PER_1K_TOKENS = 0.00025;

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [allSessions, allMessages] = await Promise.all([
    db.select().from(chatSessions).orderBy(desc(chatSessions.createdAt)),
    db.select().from(chatMessages),
  ]);

  const totalTokensUsed = allMessages.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
  const estimatedCostUSD = (totalTokensUsed / 1000) * COST_PER_1K_TOKENS;
  const avgTokensPerSession = allSessions.length > 0 ? totalTokensUsed / allSessions.length : 0;

  // Per-session breakdown
  const sessionBreakdown = allSessions.map((session) => {
    const msgs = allMessages.filter((m) => m.sessionId === session.sessionId);
    const totalTokens = msgs.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
    return {
      sessionId: session.sessionId,
      totalTokens,
      messageCount: msgs.length,
      createdAt: session.createdAt,
      language: session.language,
    };
  });

  return new Response(JSON.stringify({
    totalTokensUsed,
    totalInputTokens: 0, // tracked together for now
    totalOutputTokens: 0,
    estimatedCostUSD,
    avgTokensPerSession,
    sessionBreakdown,
  }), { headers: { "Content-Type": "application/json" } });
}