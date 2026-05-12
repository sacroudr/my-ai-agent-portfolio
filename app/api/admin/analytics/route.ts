import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db/helpers";
import { chatSessions, chatMessages } from "@/lib/db/schema";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === process.env.ADMIN_PASSWORD;
}

// Phrases the agent uses when it doesn't know something
const UNANSWERED_SIGNALS = [
  "i don't have that information",
  "i don't have information",
  "i don't have details",
  "not in the context",
  "not mentioned in",
  "no information about",
  "can't find that",
  "cannot find that",
  "isn't available",
  "is not available",
  "reach riad directly",
  "contact riad directly",
  "je n'ai pas cette information",
  "je n'ai pas d'information",
  "pas dans le contexte",
  "pas mentionné",
  "contactez riad directement",
  "contacter riad directement",
  "pas de détails",
  "cette information n'est pas",
];

function isUnanswered(content: string): boolean {
  const lower = content.toLowerCase();
  return UNANSWERED_SIGNALS.some((signal) => lower.includes(signal));
}

export async function GET(req: NextRequest) {
  if (!await isAuthenticated()) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [allSessions, allMessages] = await Promise.all([
    db.select().from(chatSessions),
    db.select().from(chatMessages),
  ]);

  // -------------------------------------------------------------------
  // BASIC STATS
  // -------------------------------------------------------------------
  const totalSessions = allSessions.length;
  const totalMessages = allMessages.length;
  const userMessages = allMessages.filter((m) => m.role === "user").length;
  const assistantMessages = allMessages.filter((m) => m.role === "assistant").length;
  const frSessions = allSessions.filter((s) => s.language === "fr").length;
  const enSessions = allSessions.filter((s) => s.language === "en").length;
  const frMessages = allMessages.filter((m) => m.language === "fr").length;
  const enMessages = allMessages.filter((m) => m.language === "en").length;

  // -------------------------------------------------------------------
  // TOP QUESTIONS (all user messages, deduplicated)
  // -------------------------------------------------------------------
  const userMsgContents = allMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim().slice(0, 120));

  const questionCounts: Record<string, number> = {};
  for (const q of userMsgContents) {
    questionCounts[q] = (questionCounts[q] || 0) + 1;
  }
  const topQuestions = Object.entries(questionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([content, count]) => ({ content, count }));

  // -------------------------------------------------------------------
  // FIRST QUESTION ANALYSIS
  // Group messages by session, find the first user message per session
  // -------------------------------------------------------------------
  const messagesBySession: Record<string, typeof allMessages> = {};
  for (const msg of allMessages) {
    if (!messagesBySession[msg.sessionId]) {
      messagesBySession[msg.sessionId] = [];
    }
    messagesBySession[msg.sessionId].push(msg);
  }

  // Sort each session's messages by createdAt
  for (const sessionId of Object.keys(messagesBySession)) {
    messagesBySession[sessionId].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // Extract first user message per session
  const firstQuestions: string[] = [];
  for (const sessionId of Object.keys(messagesBySession)) {
    const firstUserMsg = messagesBySession[sessionId].find((m) => m.role === "user");
    if (firstUserMsg) {
      firstQuestions.push(firstUserMsg.content.trim().slice(0, 120));
    }
  }

  // Count and rank first questions
  const firstQuestionCounts: Record<string, number> = {};
  for (const q of firstQuestions) {
    firstQuestionCounts[q] = (firstQuestionCounts[q] || 0) + 1;
  }
  const topFirstQuestions = Object.entries(firstQuestionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([content, count]) => ({ content, count }));

  // -------------------------------------------------------------------
  // UNANSWERED QUESTIONS DETECTOR
  // Find user messages that were followed by an agent response
  // containing unanswered signals
  // -------------------------------------------------------------------
  const unansweredQuestions: {
    userQuestion: string;
    agentResponse: string;
    sessionId: string;
    language: string;
    createdAt: string;
  }[] = [];

  for (const sessionId of Object.keys(messagesBySession)) {
    const msgs = messagesBySession[sessionId];

    for (let i = 0; i < msgs.length - 1; i++) {
      const current = msgs[i];
      const next = msgs[i + 1];

      // If current is user and next is assistant and next looks unanswered
      if (
        current.role === "user" &&
        next.role === "assistant" &&
        isUnanswered(next.content)
      ) {
        unansweredQuestions.push({
          userQuestion: current.content.trim().slice(0, 200),
          agentResponse: next.content.trim().slice(0, 300),
          sessionId,
          language: current.language,
          createdAt: current.createdAt as unknown as string,
        });
      }
    }
  }

  // Deduplicate by similar question content
  const seenQuestions = new Set<string>();
  const deduplicatedUnanswered = unansweredQuestions.filter((q) => {
    const key = q.userQuestion.toLowerCase().slice(0, 60);
    if (seenQuestions.has(key)) return false;
    seenQuestions.add(key);
    return true;
  });

  // -------------------------------------------------------------------
  // DAILY ACTIVITY — last 14 days
  // -------------------------------------------------------------------
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const dailyMap: Record<string, { sessions: number; messages: number }> = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap[key] = { sessions: 0, messages: 0 };
  }

  for (const s of allSessions) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].sessions++;
  }
  for (const m of allMessages) {
    const key = new Date(m.createdAt).toISOString().slice(0, 10);
    if (dailyMap[key]) dailyMap[key].messages++;
  }

  const dailyActivity = Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts }));

  return new Response(JSON.stringify({
    // Basic stats
    totalSessions, totalMessages, userMessages, assistantMessages,
    frSessions, enSessions, frMessages, enMessages,
    // Questions
    topQuestions,
    // New
    topFirstQuestions,
    unansweredQuestions: deduplicatedUnanswered,
    unansweredCount: unansweredQuestions.length,
    // Activity
    dailyActivity,
  }), { headers: { "Content-Type": "application/json" } });
}