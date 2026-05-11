"use client";

import { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";

interface UsageData {
  totalTokensUsed: number;
  estimatedCostUSD: number;
  avgTokensPerSession: number;
  sessionBreakdown: {
    sessionId: string;
    totalTokens: number;
    messageCount: number;
    createdAt: string;
    language: string;
  }[];
}

const StatCard = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) => (
  <div style={{
    background: "var(--bg-elevated)",
    border: `1px solid ${accent ? "var(--accent)" : "var(--border)"}`,
    borderRadius: "var(--radius)", padding: "1.25rem",
    display: "flex", flexDirection: "column", gap: "0.4rem",
  }}>
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {label}
    </p>
    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: accent ? "var(--accent)" : "var(--text-primary)", lineHeight: 1 }}>
      {value}
    </p>
    {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>{sub}</p>}
  </div>
);

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/usage")
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

  return (
    <AdminShell>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
          Token Usage
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Claude Haiku 4.5 · $0.00025 / 1k tokens
        </p>
      </div>

      {/* Balance note */}
      <div style={{
        background: "var(--accent-dim)", border: "1px solid var(--accent)",
        borderRadius: "var(--radius-sm)", padding: "0.85rem 1.25rem",
        marginBottom: "1.5rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
      }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Live credit balance is not available via the API — check it directly in the Anthropic Console.
        </p>
        <a
          href="https://platform.claude.com/usage"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-mono)", fontSize: "0.65rem",
            color: "var(--accent)", textDecoration: "none",
            border: "1px solid var(--accent)", borderRadius: "4px",
            padding: "0.35rem 0.85rem", whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--bg-base)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
        >
          Open Console →
        </a>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total Tokens" value={data.totalTokensUsed.toLocaleString()} sub="All conversations" />
        <StatCard label="Estimated Cost" value={`$${data.estimatedCostUSD.toFixed(4)}`} sub="Based on Haiku pricing" accent />
        <StatCard label="Avg / Session" value={Math.round(data.avgTokensPerSession).toLocaleString()} sub="Tokens per session" />
        <StatCard label="Model" value="Haiku 4.5" sub="Fast · Cost-efficient" />
      </div>

      {/* Per-session table */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{
          padding: "0.85rem 1.5rem", borderBottom: "1px solid var(--border)",
          fontFamily: "var(--font-mono)", fontSize: "0.58rem",
          color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase",
          display: "grid", gridTemplateColumns: "1fr 60px 80px 90px 130px", gap: "1rem",
        }}>
          <span>Session ID</span>
          <span>Lang</span>
          <span>Messages</span>
          <span>Tokens</span>
          <span>Date</span>
        </div>

        {data.sessionBreakdown.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
            No usage data yet
          </div>
        ) : (
          <div style={{ maxHeight: "calc(100vh - 420px)", overflowY: "auto" }}>
            {data.sessionBreakdown.map((session, i) => (
              <div
                key={session.sessionId}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderBottom: i < data.sessionBreakdown.length - 1 ? "1px solid var(--border)" : "none",
                  display: "grid", gridTemplateColumns: "1fr 60px 80px 90px 130px",
                  gap: "1rem", alignItems: "center",
                  fontSize: "0.72rem", color: "var(--text-secondary)",
                  fontFamily: "var(--font-mono)",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  {session.sessionId}
                </span>
                <span style={{ color: "var(--accent)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                  {session.language.toUpperCase()}
                </span>
                <span>{session.messageCount}</span>
                <span style={{ color: session.totalTokens > 5000 ? "#F59E0B" : "var(--text-secondary)" }}>
                  {session.totalTokens.toLocaleString()}
                </span>
                <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
                  {new Date(session.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}