"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import LeftPanel from "./LeftPanel";
import MessageBubble, { Message } from "./MessageBubble";

const WELCOME_MESSAGE = "Hi, I'm Riad's AI. Ask me anything about his work, stack, or availability — in English or French.";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    const history = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No language sent — backend detects it from the message
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, isStreaming: true }
                    : m
                )
              );
            } catch {}
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Something went wrong. Please try again.", isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-base)" }}>

      {/* Left panel */}
      {!isMobile && (
        <LeftPanel onSuggestedQuestion={(q) => sendMessage(q)} />
      )}

      {/* Chat area */}
      <main
        className="animate-fade-up delay-2"
        style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}
      >
        {/* Mobile header */}
        {isMobile && (
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "var(--bg-elevated)",
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "1px solid var(--border-strong)",
              overflow: "hidden", flexShrink: 0,
            }}>
              <img src="/avatar.jpg" alt="Riad Sacroud" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                Riad Sacroud
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                AI Portfolio · EN / FR
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "2rem",
          display: "flex", flexDirection: "column", gap: "1.5rem",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 97%, transparent 100%)",
        }}>
          {/* Welcome state */}
          {isEmpty && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "1.5rem", padding: "2rem",
              animation: "fadeIn 0.6s ease forwards",
            }}>
              <div style={{ textAlign: "center", maxWidth: 420 }}>
                <p style={{
                  fontFamily: "var(--font-display)", fontSize: "1.4rem",
                  color: "var(--text-primary)", lineHeight: 1.4,
                  marginBottom: "0.75rem", fontStyle: "italic",
                }}>
                  {WELCOME_MESSAGE}
                </p>
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                  color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  Powered by RAG · Claude · pgvector
                </p>
              </div>

              {/* Mobile suggested questions */}
              {isMobile && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", maxWidth: 360 }}>
                  {["What's his stack?", "Available for hire?", "His projects?"].map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)} style={{
                      background: "transparent", border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)", padding: "0.4rem 0.75rem",
                      fontFamily: "var(--font-body)", fontSize: "0.75rem",
                      color: "var(--text-secondary)", cursor: "pointer",
                    }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--text-muted)",
                    animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="animate-fade-up delay-3"
          style={{ padding: "1rem 2rem 1.5rem", flexShrink: 0, borderTop: "1px solid var(--border)", background: "var(--bg-base)" }}
        >
          <div
            style={{
              display: "flex", gap: "0.75rem", alignItems: "flex-end",
              background: "var(--bg-elevated)", border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius)", padding: "0.75rem 1rem",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about Riad... / Posez une question sur Riad..."
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                resize: "none", fontFamily: "var(--font-body)", fontSize: "0.85rem",
                color: "var(--text-primary)", lineHeight: 1.6,
                minHeight: "1.6em", maxHeight: "120px", overflowY: "auto",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                width: 34, height: 34, borderRadius: "var(--radius-sm)",
                background: input.trim() && !isLoading ? "var(--accent)" : "var(--bg-subtle)",
                border: "none", cursor: input.trim() && !isLoading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: input.trim() && !isLoading ? "var(--bg-base)" : "var(--text-muted)",
                flexShrink: 0, transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { if (input.trim() && !isLoading) e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { if (input.trim() && !isLoading) e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)",
            textAlign: "center", marginTop: "0.5rem", letterSpacing: "0.06em",
          }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  );
}