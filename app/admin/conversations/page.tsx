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

const SkeletonRow = () => (
  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={{ width: 28, height: 18, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, height: 10, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
    </div>
    <div style={{ height: 10, background: "var(--bg-subtle)", borderRadius: 4, width: "80%", animation: "skeleton-pulse 1.5s ease-in-out infinite", animationDelay: "0.2s" }} />
  </div>
);

const SkeletonMessage = ({ align }: { align: "left" | "right" }) => (
  <div style={{ display: "flex", justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
    <div style={{
      width: "55%", height: 52, background: "var(--bg-subtle)", borderRadius: align === "right" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
      animation: "skeleton-pulse 1.5s ease-in-out infinite",
    }} />
  </div>
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);

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

  const filtered = sessions.filter(s =>
    !search || (s.firstMessage || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Conversations
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
              {sessions.length} total sessions
            </p>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>

      {/* Two-panel layout */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: "calc(100vh - 148px)" }}>

        {/* ── Left: session list ─────────────────────────────── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}>
          {/* Search input */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", position: "relative", flexShrink: 0 }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"
              style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Filter sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 34,
                paddingLeft: 34,
                paddingRight: 10,
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-strong)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
          </div>

          {/* Sessions list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingSessions ? (
              <>
                <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
              </>
            ) : filtered.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, padding: "2rem" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "var(--text-muted)", textAlign: "center" }}>
                  {search ? "No matches" : "No sessions yet"}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "center" }}>
                  {search ? "Try a different search term" : "Conversations will appear here"}
                </p>
              </div>
            ) : (
              filtered.map((session) => {
                const isActive = selected === session.sessionId;
                const isEN = session.language?.toUpperCase() === "EN";
                return (
                  <div
                    key={session.sessionId}
                    onClick={() => loadMessages(session.sessionId)}
                    style={{
                      height: 72,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                      background: isActive ? "var(--accent-dim)" : "transparent",
                      cursor: "pointer",
                      transition: "background 150ms ease, border-color 150ms ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 4,
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-subtle)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Row 1: badge + count + date */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.52rem",
                        lineHeight: "20px",
                        padding: "0 6px",
                        borderRadius: 999,
                        background: isEN ? "rgba(6,182,212,0.1)" : "rgba(139,92,246,0.1)",
                        color: isEN ? "var(--accent)" : "#8B5CF6",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        flexShrink: 0,
                      }}>
                        {session.language?.toUpperCase() || "EN"}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)" }}>
                        {session.messageCount} msg
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                        {formatDateShort(session.createdAt)}
                      </span>
                    </div>
                    {/* Row 2: first message preview */}
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.73rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      margin: 0,
                    }}>
                      {session.firstMessage || "—"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: conversation view ───────────────────────── */}
        <div style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {!selected ? (
            /* Empty state */
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "2rem",
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text-muted)" }}>
                Select a conversation
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", maxWidth: 260 }}>
                Choose a session from the left to view the full exchange
              </p>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div style={{
                height: 44,
                padding: "0 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {loadingMessages ? "Loading..." : `${messages.length} messages`}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "0.52rem",
                  color: "var(--text-muted)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: 280,
                }}>
                  {selected}
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
                {loadingMessages ? (
                  <>
                    <SkeletonMessage align="right" />
                    <SkeletonMessage align="left" />
                    <SkeletonMessage align="right" />
                    <SkeletonMessage align="left" />
                  </>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                    No messages in this session
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                        gap: 4,
                      }}
                    >
                      {/* Label row */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexDirection: msg.role === "user" ? "row-reverse" : "row",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.55rem",
                          color: msg.role === "user" ? "var(--accent)" : "var(--text-muted)",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}>
                          {msg.role}
                        </span>
                        {msg.role === "assistant" && msg.tokensUsed > 0 && (
                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.5rem",
                            color: "var(--text-muted)",
                            background: "var(--bg-subtle)",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}>
                            {msg.tokensUsed} tokens
                          </span>
                        )}
                        <span style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.52rem",
                          color: "var(--text-muted)",
                          opacity: hoveredMsg === msg.id ? 1 : 0,
                          transition: "opacity 150ms ease",
                        }}>
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>

                      {/* Bubble */}
                      {msg.role === "user" ? (
                        <div style={{
                          maxWidth: "72%",
                          background: "var(--accent-dim)",
                          border: "1px solid rgba(6,182,212,0.2)",
                          borderRadius: "12px 12px 2px 12px",
                          padding: "10px 14px",
                          fontFamily: "var(--font-body)",
                          fontSize: "0.8rem",
                          color: "var(--text-primary)",
                          lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}>
                          {msg.content}
                        </div>
                      ) : (
                        <div style={{
                          maxWidth: "80%",
                          borderLeft: "3px solid var(--border-strong)",
                          paddingLeft: 12,
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.7,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
