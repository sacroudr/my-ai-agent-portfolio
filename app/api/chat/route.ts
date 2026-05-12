import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { embedQuery } from "@/lib/rag/embed";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildSystemPrompt } from "@/lib/rag/systemPrompt";
import { detectLanguage } from "@/lib/detectLanguage";
import { getOrCreateSession, logMessage } from "@/lib/db/helpers";

export const runtime = "nodejs";
export const maxDuration = 30;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// -------------------------------------------------------------------
// Generate 3 follow-up question suggestions based on the conversation
// -------------------------------------------------------------------
async function generateFollowUps(
  userQuery: string,
  agentResponse: string,
  language: "fr" | "en"
): Promise<string[]> {
  const prompt =
    language === "fr"
      ? `Tu es l'assistant IA du portfolio de Riad Sacroud, un ingénieur full-stack junior.

L'utilisateur vient de demander: "${userQuery}"
Tu as répondu: "${agentResponse.slice(0, 400)}"

Génère exactement 3 questions de suivi courtes et pertinentes que l'utilisateur pourrait vouloir poser ensuite. Ces questions doivent:
- Être naturelles et conversationnelles
- Être liées au sujet actuel ou explorer un aspect connexe du profil de Riad
- Être formulées du point de vue de l'utilisateur (commencer par "Quels", "Est-ce", "A-t-il", "Peut-il", "Quel", etc.)
- Faire maximum 8 mots chacune

Réponds UNIQUEMENT avec un tableau JSON de 3 strings, sans aucun autre texte:
["question 1", "question 2", "question 3"]`
      : `You are the AI assistant for Riad Sacroud's portfolio, a junior full-stack engineer.

The user just asked: "${userQuery}"
You responded: "${agentResponse.slice(0, 400)}"

Generate exactly 3 short, relevant follow-up questions the user might want to ask next. These should:
- Feel natural and conversational
- Relate to the current topic or explore a connected aspect of Riad's profile
- Be phrased from the user's perspective (start with "What", "Has he", "Can he", "Is he", "How", etc.)
- Be maximum 8 words each

Respond ONLY with a JSON array of 3 strings, no other text:
["question 1", "question 2", "question 3"]`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Strip markdown code fences if present
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed.map((q: string) => String(q).trim());
    }
    return [];
  } catch {
    // Follow-ups are non-critical — fail silently
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return new Response(JSON.stringify({ error: "No sessionId provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return new Response(JSON.stringify({ error: "Last message must be from user" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userQuery = lastMessage.content as string;
    const language: "fr" | "en" = detectLanguage(userQuery);

    await getOrCreateSession(sessionId, language);
    await logMessage({ sessionId, role: "user", content: userQuery, language });

    // RAG pipeline
    // Build a context-aware query by combining the last 3 user messages.
    // This fixes follow-up questions like "tell me more about the first one"
    // which have no semantic meaning without prior context.
    const recentUserMessages = messages
      .filter((m: { role: string; content: string }) => m.role === "user")
      .slice(-3)
      .map((m: { role: string; content: string }) => m.content.trim());

    // Weight the current query more heavily by repeating it
    const contextualQuery = recentUserMessages.length > 1
      ? `${recentUserMessages.slice(0, -1).join(" ")} ${userQuery} ${userQuery}`
      : userQuery;

    const queryEmbedding = await embedQuery(contextualQuery);
    const relevantChunks = await retrieveRelevantChunks(queryEmbedding);
    const systemPrompt = buildSystemPrompt(relevantChunks, language);

    const claudeMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // --- Main response stream ---
          const claudeStream = anthropic.messages.stream({
            model: "claude-haiku-4-5",
            max_tokens: 2048,
            system: systemPrompt,
            messages: claudeMessages,
          });

          for await (const chunk of claudeStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              if (text) {
                fullResponse += text;
                controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
              }
            }
          }

          const finalMessage = await claudeStream.finalMessage();
          const tokensUsed = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens;

          await logMessage({
            sessionId, role: "assistant",
            content: fullResponse, language, tokensUsed,
          });

          // Signal end of main stream
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));

          // --- Follow-up generation (after main stream ends) ---
          const followUps = await generateFollowUps(userQuery, fullResponse, language);

          if (followUps.length > 0) {
            // Send follow-ups as a special event the client can parse
            controller.enqueue(
              encoder.encode(`f:${JSON.stringify(followUps)}\n`)
            );
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        "X-Language": language,
      },
    });
  } catch (err: any) {
    console.error("[/api/chat] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}