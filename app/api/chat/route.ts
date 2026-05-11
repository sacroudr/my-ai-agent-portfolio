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

    // Detect language from the latest user message
    const language: "fr" | "en" = detectLanguage(userQuery);

    // Ensure session exists in DB
    await getOrCreateSession(sessionId, language);

    // Log the user message
    await logMessage({
      sessionId,
      role: "user",
      content: userQuery,
      language,
    });

    // RAG pipeline
    const queryEmbedding = await embedQuery(userQuery);
    const relevantChunks = await retrieveRelevantChunks(queryEmbedding);
    const systemPrompt = buildSystemPrompt(relevantChunks, language);

    // Build Claude message history
    const claudeMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Accumulate full response for logging after streaming
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
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
                controller.enqueue(
                  encoder.encode(`0:${JSON.stringify(text)}\n`)
                );
              }
            }
          }

          // Get token usage from the completed stream
          const finalMessage = await claudeStream.finalMessage();
          const tokensUsed = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens;

          // Log the complete assistant response with token count
          await logMessage({
            sessionId,
            role: "assistant",
            content: fullResponse,
            language,
            tokensUsed,
          });

          controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
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