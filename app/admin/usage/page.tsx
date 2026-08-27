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

const SkeletonCard = () => (
  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ width: 60, height: 10, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
    <div style={{ width: 80, height: 28, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite", animationDelay: "0.15s" }} />
    <div style={{ width: 100, height: 8, background: "var(--bg-subtle)", borderRadius: 4, animation: "skeleton-pulse 1.5s ease-in-out infinite", animationDelay: "0.3s" }} />
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
      Couldn&apos;t load token usage
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

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}
const StatCard = ({ label, value, sub, icon, accent }: StatCardProps) => (
  <div style={{
    background: "var(--bg-elevated)",
    border: accent ? "1px solid rgba(6,182,212,0.3)" : "1px solid var(--border)",
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
    <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1, color: accent ? "var(--accent)" : "var(--text-primary)" }}>
      {value}
    </p>
    {sub && <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 4 }}>{sub}</p>}
  </div>
);

function tokenColor(n: number) {
  if (n > 5000) return "#F59E0B";
  if (n >= 1000) return "var(--text-secondary)";
  return "var(--text-muted)";
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [sliceTooltip, setSliceTooltip] = useState<{ x: number; y: number; sessionId: string; tokens: number } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage")
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
        console.error("[admin/usage] Failed to load usage:", message);
        setError(message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <AdminShell>
      <div style={{ marginBottom: 24 }}>
        <div style={{ width: 140, height: 28, background: "var(--bg-subtle)", borderRadius: 6, animation: "skeleton-pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    </AdminShell>
  );

  if (error) return (
    <AdminShell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
          Token Usage
        </h1>
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>
      <ErrorPanel message={error} />
    </AdminShell>
  );

  if (!data) return null;

  const totalTokens = data.totalTokensUsed || 1;

  return (
    <AdminShell>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Token Usage
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
              Claude Haiku 4.5 · $0.00025 / 1k tokens
            </p>
          </div>
          <a
            href="https://platform.claude.com/usage"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              border: "1px solid var(--border-strong)",
              background: "transparent",
              borderRadius: "var(--radius-sm)",
              padding: "8px 16px",
              transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "var(--accent-dim)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Anthropic Console
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <div style={{ height: 1, background: "var(--border)", marginTop: 16 }} />
      </div>

      {/* ── Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Tokens" value={data.totalTokensUsed.toLocaleString()} sub="All conversations"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
        <StatCard label="Estimated Cost" value={`$${data.estimatedCostUSD.toFixed(4)}`} sub="Based on Haiku pricing" accent
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard label="Avg / Session" value={Math.round(data.avgTokensPerSession).toLocaleString()} sub="Tokens per session"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
        />
        <StatCard label="Model" value="Haiku 4.5" sub="Fast · Cost-efficient"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
        />
      </div>

      {/* ── Cost breakdown stacked bar */}
      {data.sessionBreakdown.length > 0 && (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 16, position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Token Distribution by Session
          </p>
          <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex", cursor: "default" }}>
            {data.sessionBreakdown.map((session, i) => {
              const widthPct = (session.totalTokens / totalTokens) * 100;
              const opacity = 0.35 + (i % 5) * 0.13;
              const isHovered = hoveredSlice === session.sessionId;
              return (
                <div
                  key={session.sessionId}
                  style={{
                    width: `${widthPct}%`,
                    height: "100%",
                    background: "var(--accent)",
                    opacity: isHovered ? 1 : opacity,
                    transition: "opacity 150ms ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    setHoveredSlice(session.sessionId);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setSliceTooltip({ x: rect.left + rect.width / 2, y: rect.top, sessionId: session.sessionId, tokens: session.totalTokens });
                  }}
                  onMouseLeave={() => {
                    setHoveredSlice(null);
                    setSliceTooltip(null);
                  }}
                />
              );
            })}
          </div>
          {sliceTooltip && (
            <div style={{
              position: "fixed",
              left: sliceTooltip.x,
              top: sliceTooltip.y - 64,
              transform: "translateX(-50%)",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              padding: "6px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "var(--text-primary)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 200,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}>
              <p style={{ color: "var(--text-muted)", marginBottom: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                {sliceTooltip.sessionId.slice(0, 20)}...
              </p>
              <p><span style={{ color: "var(--accent)" }}>{sliceTooltip.tokens.toLocaleString()}</span> tokens</p>
            </div>
          )}
        </div>
      )}

      {/* ── Per-session table */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {/* Sticky header */}
        <div style={{
          padding: "10px 20px",
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "1fr 52px 80px 100px 80px 120px",
          gap: 12,
          fontFamily: "var(--font-mono)",
          fontSize: "0.58rem",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          position: "sticky",
          top: 0,
          background: "var(--bg-elevated)",
          zIndex: 1,
        }}>
          <span>Session ID</span>
          <span>Lang</span>
          <span>Messages</span>
          <span style={{ textAlign: "right" }}>Tokens</span>
          <span style={{ textAlign: "right" }}>Cost</span>
          <span>Date</span>
        </div>

        {data.sessionBreakdown.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "3rem" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "var(--text-muted)" }}>No usage data yet</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>Token usage will appear after the first conversation</p>
          </div>
        ) : (
          <div style={{ maxHeight: "calc(100vh - 480px)", overflowY: "auto" }}>
            {data.sessionBreakdown.map((session, i) => {
              const isHovered = hoveredRow === session.sessionId;
              const isEven = i % 2 === 1;
              const costForSession = (session.totalTokens / 1000) * 0.00025;
              const isEN = session.language?.toUpperCase() === "EN";
              return (
                <div
                  key={session.sessionId}
                  style={{
                    padding: "10px 20px",
                    borderBottom: i < data.sessionBreakdown.length - 1 ? "1px solid var(--border)" : "none",
                    display: "grid",
                    gridTemplateColumns: "1fr 52px 80px 100px 80px 120px",
                    gap: 12,
                    alignItems: "center",
                    background: isHovered ? "var(--bg-subtle)" : isEven ? "rgba(24,24,27,0.4)" : "transparent",
                    transition: "background 150ms ease",
                    cursor: "default",
                    position: "relative",
                  }}
                  onMouseEnter={() => setHoveredRow(session.sessionId)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <span
                    title={session.sessionId}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "help" }}
                  >
                    {session.sessionId}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.6rem",
                    color: isEN ? "var(--accent)" : "#8B5CF6",
                    letterSpacing: "0.08em",
                  }}>
                    {session.language?.toUpperCase() || "EN"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    {session.messageCount}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: tokenColor(session.totalTokens), textAlign: "right" }}>
                    {session.totalTokens.toLocaleString()}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "right" }}>
                    ${costForSession.toFixed(5)}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-muted)" }}>
                    {new Date(session.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
