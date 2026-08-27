import { eq } from "drizzle-orm";
import { db } from "./index";
import { chatSessions, chatMessages } from "./schema";

// -------------------------------------------------------------------
// SESSIONS
// -------------------------------------------------------------------

/**
 * Gets an existing session or creates a new one.
 * Returns true if the session was just created (new visitor).
 */
export async function getOrCreateSession(
  sessionId: string,
  language: "fr" | "en"
): Promise<boolean> {
  const existing = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(chatSessions).values({ sessionId, language });
    return true; // new session
  }

  return false; // existing session
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

// -------------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------------

/**
 * Sends an email notification when a new session starts.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function sendNewSessionNotification(
  firstQuestion: string,
  language: "fr" | "en",
  sessionId: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) return;

  const date = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const langLabel = language === "fr" ? "🇫🇷 French" : "🇬🇧 English";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AI Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_EMAIL],
        subject: `👀 New visitor on your AI Portfolio`,
        html: `
          <div style="font-family: 'Courier New', monospace; max-width: 560px; margin: 0 auto; padding: 32px; background: #09090b; color: #fafafa; border-radius: 8px;">

            <div style="border-left: 3px solid #06B6D4; padding-left: 16px; margin-bottom: 28px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #71717a; letter-spacing: 0.1em; text-transform: uppercase;">
                AI Portfolio — New Session
              </p>
              <h1 style="margin: 0; font-size: 18px; color: #fafafa; font-weight: 400;">
                Someone is looking at your profile
              </h1>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 11px; color: #71717a; width: 100px; vertical-align: top; text-transform: uppercase; letter-spacing: 0.08em;">
                  When
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 13px; color: #fafafa;">
                  ${date}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 11px; color: #71717a; vertical-align: top; text-transform: uppercase; letter-spacing: 0.08em;">
                  Language
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 13px; color: #fafafa;">
                  ${langLabel}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0; font-size: 11px; color: #71717a; vertical-align: top; text-transform: uppercase; letter-spacing: 0.08em;">
                  First question
                </td>
                <td style="padding: 12px 0 0; font-size: 14px; color: #06B6D4; line-height: 1.6; font-style: italic;">
                  "${firstQuestion}"
                </td>
              </tr>
            </table>

            <div style="margin-top: 8px; padding: 12px 16px; background: #111113; border-radius: 6px; border: 1px solid #27272a;">
              <p style="margin: 0; font-size: 11px; color: #52525b; line-height: 1.6;">
                Session ID: <span style="color: #3f3f46;">${sessionId.slice(0, 32)}...</span>
              </p>
            </div>

          </div>
        `,
      }),
    });
  } catch (err) {
    // Non-critical — never block the main flow
    console.error("[sendNewSessionNotification] Failed:", err);
  }
}