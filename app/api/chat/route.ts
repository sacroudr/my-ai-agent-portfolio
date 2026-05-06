import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { embedQuery } from "@/lib/rag/embed";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildSystemPrompt } from "@/lib/rag/systemPrompt";
import { detectLanguage } from "@/lib/detectLanguage";

export const runtime = "nodejs";
export const maxDuration = 30;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, language: clientLanguage } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
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

    // Detect language
    const language: "fr" | "en" =
      clientLanguage === "fr" || clientLanguage === "en"
        ? clientLanguage
        : detectLanguage(userQuery);

    // RAG pipeline
    const queryEmbedding = await embedQuery(userQuery);
    const relevantChunks = await retrieveRelevantChunks(queryEmbedding);
    const systemPrompt = buildSystemPrompt(relevantChunks, language);

    // Build message history for Claude
    // Claude uses "user" and "assistant" roles — same as our app
    const claudeMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Stream from Claude
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
                controller.enqueue(
                  encoder.encode(`0:${JSON.stringify(text)}\n`)
                );
              }
            }
          }

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