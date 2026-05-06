"use client";

import { useState } from "react";

interface LeftPanelProps {
  onSuggestedQuestion: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "What is Riad's main stack?",
  "Tell me about Wheels&Trade",
  "Is Riad available for hire?",
  "What projects has he built?",
  "Quelle est sa formation ?",
  "Peut-il travailler à distance ?",
];

export default function LeftPanel({ onSuggestedQuestion }: LeftPanelProps) {
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);

  return (
    <aside
      className="animate-slide-left"
      style={{
        width: "var(--panel-width)",
        minWidth: "var(--panel-width)",
        height: "100vh",
        background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)",
        borderLeft: "2px solid var(--accent)",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 1.5rem",
        gap: "1.5rem",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Identity */}
      <div className="animate-fade-up delay-1" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "1px solid var(--border-strong)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src="/riad-photo.png"
            alt="Riad Sacroud"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Name & title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "var(--text-primary)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Riad Sacroud
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              fontWeight: 300,
              color: "var(--text-secondary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Full-Stack Engineer
          </p>
        </div>

        {/* Availability badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--green)",
              animation: "pulse-glow 2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              color: "var(--green)",
              letterSpacing: "0.06em",
            }}
          >
            Available · CDI & Freelance
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        className="animate-fade-up delay-2"
        style={{ height: 1, background: "var(--border)", flexShrink: 0 }}
      />

      {/* Language note */}
      <div className="animate-fade-up delay-2">
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "var(--text-muted)",
          letterSpacing: "0.06em",
          lineHeight: 1.6,
        }}>
          Ask in English or French —<br />
          the agent detects your language automatically.
        </p>
      </div>

      {/* Suggested questions */}
      <div className="animate-fade-up delay-3" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Suggestions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggestedQuestion(q)}
              onMouseEnter={() => setHoveredChip(i)}
              onMouseLeave={() => setHoveredChip(null)}
              style={{
                background: hoveredChip === i ? "var(--accent-dim)" : "transparent",
                border: `1px solid ${hoveredChip === i ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "0.5rem 0.75rem",
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                color: hoveredChip === i ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                lineHeight: 1.4,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />

      {/* Social links */}
      <div
        className="animate-fade-up delay-4"
        style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
      >
        <a
          href="https://github.com/sacroudr"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          style={{ color: "var(--text-muted)", transition: "color 0.15s ease", lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

        <a
          href="https://www.linkedin.com/in/riad-sacroud-7a5b73166/"
          target="_blank"
          rel="noopener noreferrer"
          title="LinkedIn"
          style={{ color: "var(--text-muted)", transition: "color 0.15s ease", lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>

        <a
          href="mailto:sacroudr@gmail.com"
          title="Email"
          style={{ color: "var(--text-muted)", transition: "color 0.15s ease", lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </a>

        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
          }}
        >
          Next.js · RAG · AI
        </span>
      </div>
    </aside>
  );
}