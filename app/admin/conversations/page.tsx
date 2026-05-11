"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";

interface Session {
  id: string;
  sessionId: string;
  language: string;
  createdAt: string;
  messageCount: number;
  firstMessage: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  tokensUsed: number;
  createdAt: string;
}

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((data) => { setSessions(data); setLoadingSessions(false); });
  }, []);

  const loadMessages = async (sessionId: string) => {
    setSelected(sessionId);
    setLoadingMessages(true);
    const res = await fetch(`/api/admin/sessions/${sessionId}/messages`);
    const data = await res.json();
    setMessages(data);
    setLoadingMessages(false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <AdminShell>
      {/* Page header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
          Conversations
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {sessions.length} total sessions
        </p>
      </div>

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem", alignItems: "start" }}>

        {/* Sessions list */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          position: "sticky",
          top: 0,
        }}>
          <div style={{
            padding: "0.85rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Sessions
          </div>

          {loadingSessions ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              No sessions yet
            </div>
          ) : (
            <div style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  onClick={() => loadMessages(session.sessionId)}
                  style={{
                    padding: "0.9rem 1.25rem",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: selected === session.sessionId ? "var(--accent-dim)" : "transparent",
                    borderLeft: selected === session.sessionId ? "2px solid var(--accent)" : "2px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (selected !== session.sessionId) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                  onMouseLeave={(e) => { if (selected !== session.sessionId) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                        color: selected === session.sessionId ? "var(--accent)" : "var(--text-muted)",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        background: "var(--bg-subtle)", padding: "0.1rem 0.35rem", borderRadius: "3px",
                      }}>
                        {session.language}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)" }}>
                        {session.messageCount} msg
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "var(--text-muted)" }}>
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                  }}>
                    {session.firstMessage || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages panel */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          minHeight: 500,
        }}>
          {!selected ? (
            <div style={{
              padding: "6rem 2rem", textAlign: "center",
              color: "var(--text-muted)", fontFamily: "var(--font-mono)",
              fontSize: "0.7rem", letterSpacing: "0.08em",
            }}>
              ← Select a session to view the conversation
            </div>
          ) : loadingMessages ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              Loading...
            </div>
          ) : (
            <>
              <div style={{
                padding: "0.85rem 1.5rem", borderBottom: "1px solid var(--border)",
                fontFamily: "var(--font-mono)", fontSize: "0.58rem",
                color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>{messages.length} messages</span>
                <span style={{ fontSize: "0.52rem" }}>{selected.slice(0, 32)}...</span>
              </div>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{
                    display: "flex", flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: "0.25rem",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.55rem",
                        color: msg.role === "user" ? "var(--accent)" : "var(--text-muted)",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>
                        {msg.role}
                      </span>
                      {msg.tokensUsed > 0 && (
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.5rem",
                          color: "var(--text-muted)", background: "var(--bg-subtle)",
                          padding: "0.1rem 0.35rem", borderRadius: "3px",
                        }}>
                          {msg.tokensUsed} tokens
                        </span>
                      )}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "var(--text-muted)" }}>
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <div style={{
                      maxWidth: "80%",
                      background: msg.role === "user" ? "var(--accent-dim)" : "var(--bg-subtle)",
                      border: `1px solid ${msg.role === "user" ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.78rem", color: "var(--text-secondary)",
                      lineHeight: 1.6, fontFamily: "var(--font-body)",
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}