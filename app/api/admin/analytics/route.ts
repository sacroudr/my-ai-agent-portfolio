import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/helpers";
import { chatSessions, chatMessages } from "@/lib/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [allSessions, allMessages] = await Promise.all([
    db.select().from(chatSessions),
    db.select().from(chatMessages),
  ]);

  const totalSessions = allSessions.length;
  const totalMessages = allMessages.length;
  const userMessages = allMessages.filter((m) => m.role === "user").length;
  const assistantMessages = allMessages.filter((m) => m.role === "assistant").length;
  const frSessions = allSessions.filter((s) => s.language === "fr").length;
  const enSessions = allSessions.filter((s) => s.language === "en").length;
  const frMessages = allMessages.filter((m) => m.language === "fr").length;
  const enMessages = allMessages.filter((m) => m.language === "en").length;

  // Top user questions (deduplicated by trimmed content)
  const userMsgs = allMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim().slice(0, 100));

  const questionCounts: Record<string, number> = {};
  for (const q of userMsgs) {
    questionCounts[q] = (questionCounts[q] || 0) + 1;
  }
  const topQuestions = Object.entries(questionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([content, count]) => ({ content, count }));

  // Daily activity — last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentSessions = allSessions.filter(
    (s) => new Date(s.createdAt) >= fourteenDaysAgo
  );
  const recentMessages = allMessages.filter(
    (m) => new Date(m.createdAt) >= fourteenDaysAgo
  );

  const dailyMap: Record<string, { sessions: number; messages: number }> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { sessions: 0, messages: 0 };
  }

  for (const s of recentSessions) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].sessions++;
  }
  for (const m of recentMessages) {
    const key = new Date(m.createdAt).toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].messages++;
  }

  const dailyActivity = Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts }));

  return new Response(JSON.stringify({
    totalSessions, totalMessages, userMessages, assistantMessages,
    frSessions, enSessions, frMessages, enMessages,
    topQuestions, dailyActivity,
  }), { headers: { "Content-Type": "application/json" } });
}