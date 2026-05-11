"use client";

import { useEffect, useState } from "react";
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
  dailyActivity: { date: string; sessions: number; messages: number }[];
}

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div style={{
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "1.25rem",
    display: "flex", flexDirection: "column", gap: "0.4rem",
  }}>
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {label}
    </p>
    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--text-primary)", lineHeight: 1 }}>
      {value}
    </p>
    {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>{sub}</p>}
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <AdminShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>Loading...</p>
      </div>
    </AdminShell>
  );

  if (!data) return null;

  const frPct = data.totalSessions > 0 ? Math.round((data.frSessions / data.totalSessions) * 100) : 0;
  const enPct = 100 - frPct;

  return (
    <AdminShell>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
          Analytics
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Overview of all interactions
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Sessions" value={data.totalSessions} sub="Unique visitors" />
        <StatCard label="Total Messages" value={data.totalMessages} sub={`${data.userMessages} user · ${data.assistantMessages} agent`} />
        <StatCard label="French" value={`${frPct}%`} sub={`${data.frSessions} sessions`} />
        <StatCard label="English" value={`${enPct}%`} sub={`${data.enSessions} sessions`} />
        <StatCard label="Avg / Session" value={data.totalSessions > 0 ? (data.totalMessages / data.totalSessions).toFixed(1) : "0"} sub="Messages per session" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Language breakdown */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Language Breakdown
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { lang: "French", pct: frPct, sessions: data.frSessions, messages: data.frMessages },
              { lang: "English", pct: enPct, sessions: data.enSessions, messages: data.enMessages },
            ].map(({ lang, pct, sessions, messages }) => (
              <div key={lang}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-secondary)" }}>{lang}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>{sessions} sessions · {messages} msg</span>
                </div>
                <div style={{ height: 5, background: "var(--bg-subtle)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 3, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top questions */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Top Questions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.topQuestions.length === 0 ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>No data yet</p>
            ) : data.topQuestions.slice(0, 7).map((q, i) => (
              <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--accent)", flexShrink: 0, marginTop: "0.1rem" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{
                  fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.4, flex: 1,
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                }}>
                  {q.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily activity chart */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", gridColumn: "1 / -1" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Daily Activity — Last 14 Days
          </p>
          {data.dailyActivity.length === 0 ? (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>No activity yet</p>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", height: 80 }}>
              {data.dailyActivity.map((day) => {
                const maxMessages = Math.max(...data.dailyActivity.map((d) => d.messages), 1);
                const height = Math.max((day.messages / maxMessages) * 100, 4);
                return (
                  <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                    <div
                      title={`${day.date}: ${day.messages} messages, ${day.sessions} sessions`}
                      style={{
                        width: "100%", height: `${height}%`,
                        background: "var(--accent)", opacity: 0.65,
                        borderRadius: "3px 3px 0 0", cursor: "default", transition: "opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.65"; }}
                    />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(day.date).toLocaleDateString("en", { month: "numeric", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}