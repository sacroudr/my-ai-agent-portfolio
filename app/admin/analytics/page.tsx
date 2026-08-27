"use client";

import { useEffect, useState, useRef } from "react";
import AdminShell from "../../components/AdminShell";

interface AnalyticsData {
  totalSessions: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  frSessions: number;
  enSessions: number;
  frMessages: number;
  enMessages: number;
  topQuestions: { content: string; count: number }[];
  topFirstQuestions: { content: string; count: number }[];
  unansweredQuestions: {
    userQuestion: string;
    agentResponse: string;
    sessionId: string;
    language: string;
    createdAt: string;
  }[];
  unansweredCount: number;
  dailyActivity: { date: string; sessions: number; messages: number }[];
}

const SkeletonCard = () => (
  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ width: 60, height: 10, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
    <div style={{ width: 80, height: 28, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite", animationDelay: "0.15s" }} />
    <div style={{ width: 100, height: 8, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite", animationDelay: "0.3s" }} />
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  warn?: boolean;
}
const StatCard = ({ label, value, sub, icon, accent, warn }: StatCardProps) => (
  <div style={{
    background: "var(--bg-elevated)",
    border: accent ? "1px solid rgba(6,182,212,0.3)" : warn ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </span>
    </div>
    <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1, color: accent ? "var(--accent)" : warn ? "#F59E0B" : "var(--text-primary)" }}>
      {value}
    </p>
    {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 4 }}>{sub}</p>}
  </div>
);

const ErrorPanel = ({ message }: { message: string }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 12, padding: "3rem",
    background: "var(--bg-elevated)", border: "1px solid var(--red-border)",
    borderRadius: "var(--radius)",
  }}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text-primary)" }}>
      Couldn&apos;t load analytics
    </p>
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
      {message}
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        background: "transparent", border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-sm)", padding: "0.5rem 1.25rem",
        fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em",
        color: "var(--text-secondary)", cursor: "pointer",
        transition: "border-color 150ms ease, color 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      Retry
    </button>
  </div>
);

interface TooltipState {
  visible: boolean;
  x: number;
  date: string;
  messages: number;
  sessions: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnanswered, setExpandedUnanswered] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, date: "", messages: 0, sessions: 0 });
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (res) => {
        // Session expired mid-visit — bounce back to the login page.
        if (res.status === 401) {
          window.location.replace("/admin");
          return null;
        }
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((d) => {
        if (d === null) return;
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[admin/analytics] Failed to load analytics:", message);
        setError(message);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string, i: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (loading) return (
    <AdminShell>
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: 120, height: 28, background: "var(--bg-subtle)", borderRadius: 6, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </AdminShell>
  );

  if (error) return (
    <AdminShell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
          Analytics
        </h1>
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>
      <ErrorPanel message={error} />
    </AdminShell>
  );

  if (!data) return null;

  const frPct = data.totalSessions > 0 ? Math.round((data.frSessions / data.totalSessions) * 100) : 0;
  const enPct = 100 - frPct;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminShell>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
          Analytics
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
          Overview of all interactions
        </p>
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>

      {/* ── Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Sessions" value={data.totalSessions} sub="Unique visitors"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Total Messages" value={data.totalMessages} sub={`${data.userMessages} user · ${data.assistantMessages} agent`}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
        />
        <StatCard label="French Sessions" value={`${frPct}%`} sub={`${data.frSessions} sessions · ${data.frMessages} msg`}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
        />
        <StatCard label="English Sessions" value={`${enPct}%`} sub={`${data.enSessions} sessions · ${data.enMessages} msg`}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
        />
        <StatCard label="Avg / Session" value={data.totalSessions > 0 ? (data.totalMessages / data.totalSessions).toFixed(1) : "0"} sub="Messages per session"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
        />
        <StatCard label="Unanswered" value={data.unansweredCount} sub="KB gaps detected"
          warn={data.unansweredCount > 0}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
      </div>

      {/* ── Daily activity chart */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 16 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
          Daily Activity — Last 14 Days
        </p>
        {data.dailyActivity.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "2rem 0" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "var(--text-muted)" }}>No activity yet</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>Activity will appear after the first conversation</p>
          </div>
        ) : (
          <div ref={chartRef} style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 120 }}>
              {data.dailyActivity.map((day) => {
                const maxMessages = Math.max(...data.dailyActivity.map((d) => d.messages), 1);
                const heightPct = Math.max((day.messages / maxMessages) * 100, 4);
                const isToday = day.date === today;
                return (
                  <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div
                      style={{ width: "100%", height: `${heightPct}%`, background: "var(--accent)", opacity: isToday ? 1 : 0.55, borderRadius: "4px 4px 0 0", cursor: "default", transition: "opacity 150ms ease" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        const rect = e.currentTarget.getBoundingClientRect();
                        const chartRect = chartRef.current?.getBoundingClientRect();
                        setTooltip({ visible: true, x: rect.left - (chartRect?.left ?? 0) + rect.width / 2, date: day.date, messages: day.messages, sessions: day.sessions });
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = isToday ? "1" : "0.55";
                        setTooltip(t => ({ ...t, visible: false }));
                      }}
                    />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(day.date).toLocaleDateString("en", { month: "numeric", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
            {tooltip.visible && (
              <div style={{
                position: "absolute", bottom: 36, left: tooltip.x, transform: "translateX(-50%)",
                background: "var(--bg-elevated)", border: "1px solid var(--border-strong)",
                borderRadius: 6, padding: "6px 10px", fontFamily: "var(--font-mono)",
                fontSize: "0.6rem", color: "var(--text-primary)", pointerEvents: "none",
                whiteSpace: "nowrap", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 3 }}>{tooltip.date}</p>
                <p><span style={{ color: "var(--accent)" }}>{tooltip.messages}</span> messages</p>
                <p><span style={{ color: "var(--accent)" }}>{tooltip.sessions}</span> sessions</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── First question analysis */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              First Question Analysis
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "var(--text-muted)", marginTop: 2 }}>
              What recruiters ask first — their primary intent when landing
            </p>
          </div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
          {data.topFirstQuestions.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "2rem 0" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "var(--text-muted)" }}>No data yet</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>First question patterns will appear here</p>
            </div>
          ) : data.topFirstQuestions.map((q, i) => {
            const maxCount = data.topFirstQuestions[0].count;
            const pct = Math.round((q.count / maxCount) * 100);
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "20px 1fr auto", gap: "0 12px", alignItems: "center", height: 48, padding: "0 4px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: i === 0 ? "var(--accent)" : "var(--text-muted)", textAlign: "right" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ overflow: "hidden" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                    {q.content}
                  </p>
                  <div style={{ height: 4, background: "var(--bg-subtle)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "var(--accent)" : "rgba(6,182,212,0.35)", borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>
                  ×{q.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Language + Top questions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
            Language Breakdown
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { lang: "English", pct: enPct, sessions: data.enSessions, messages: data.enMessages, color: "var(--accent)" },
              { lang: "French", pct: frPct, sessions: data.frSessions, messages: data.frMessages, color: "#8B5CF6" },
            ].map(({ lang, pct, sessions, messages, color }) => (
              <div key={lang}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)" }}>{lang}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>{sessions} sessions · {messages} msg</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", minWidth: 30, textAlign: "right" }}>{pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
            Top Questions (All)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.topQuestions.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "1rem 0" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>No questions yet</p>
              </div>
            ) : data.topQuestions.slice(0, 7).map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                  {q.content}
                </p>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", flexShrink: 0 }}>×{q.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Unanswered questions */}
      <div style={{ background: "var(--bg-elevated)", border: `1px solid ${data.unansweredQuestions.length > 0 ? "rgba(245,158,11,0.3)" : "var(--border)"}`, borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: data.unansweredQuestions.length > 0 ? "#F59E0B" : "var(--text-muted)" }} />
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Unanswered Questions — KB Gaps
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.57rem", color: "var(--text-muted)", marginTop: 2 }}>
                Questions where the agent didn&apos;t have enough information
              </p>
            </div>
          </div>
          {data.unansweredQuestions.length > 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "#F59E0B", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "2px 10px", borderRadius: 999 }}>
              {data.unansweredQuestions.length} gap{data.unansweredQuestions.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {data.unansweredQuestions.length === 0 ? (
          <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--green)" }}>
              No unanswered questions — your KB is covering everything well.
            </p>
          </div>
        ) : data.unansweredQuestions.map((q, i) => {
          const isExpanded = expandedUnanswered === i;
          return (
            <div key={i} style={{ borderBottom: i < data.unansweredQuestions.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div
                onClick={() => setExpandedUnanswered(isExpanded ? null : i)}
                style={{ padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12, transition: "background 150ms ease", borderLeft: isExpanded ? "3px solid #F59E0B" : "3px solid rgba(245,158,11,0.3)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.52rem",
                      color: q.language?.toUpperCase() === "EN" ? "var(--accent)" : "#8B5CF6",
                      background: q.language?.toUpperCase() === "EN" ? "rgba(6,182,212,0.1)" : "rgba(139,92,246,0.1)",
                      padding: "0 6px", borderRadius: 999, lineHeight: "18px",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                      {q.language?.toUpperCase() || "EN"}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.52rem", color: "var(--text-muted)" }}>
                      {new Date(q.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>
                    &ldquo;{q.userQuestion}&rdquo;
                  </p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 3, transition: "transform 200ms ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {isExpanded && (
                <div style={{ padding: "0 20px 16px 46px", borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 0 6px" }}>
                    Agent response
                  </p>
                  <div style={{ background: "var(--bg-base)", borderLeft: "3px solid var(--border-strong)", padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {q.agentResponse}{q.agentResponse.length >= 300 ? "..." : ""}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#0d0d0f", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--accent)" }}>npm run ingest</code>
                    <button
                      onClick={() => handleCopy("npm run ingest", i)}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: copied === i ? "var(--green)" : "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer", transition: "color 150ms ease", padding: 0, flexShrink: 0 }}
                    >
                      {copied === i ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
