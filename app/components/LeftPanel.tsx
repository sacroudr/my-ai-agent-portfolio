"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface LeftPanelProps {
  onSuggestedQuestion: (question: string) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What is Riad's main stack?",
  "Tell me about Wheels&Trade",
  "Is Riad available for hire?",
  "What projects has he built?",
  "Quelle est sa formation ?",
  "Peut-il travailler à distance ?",
];

export default function LeftPanel({ onSuggestedQuestion, theme, onToggleTheme }: LeftPanelProps) {
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings popover when clicking outside it
  useEffect(() => {
    if (!settingsOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [settingsOpen]);
  // createPortal needs document, which only exists in the browser.
  // mounted guards against SSR access to document.body.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen]);

  return (
    <>
    <aside
      className="animate-slide-left"
      style={{
        width: "var(--panel-width)",
        minWidth: "var(--panel-width)",
        height: "100vh",
        background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 1.5rem",
        gap: "1.5rem",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Top accent bar — gradient from accent to transparent, replaces the heavy left border */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, var(--accent) 0%, transparent 80%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Identity ── */}
      <div
        className="animate-fade-up delay-1"
        style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.5rem" }}
      >
        {/* Avatar with accent ring — click to open full-size lightbox */}
        <button
          onClick={() => setLightboxOpen(true)}
          aria-label="View full-size photo of Riad Sacroud"
          title="View photo"
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            padding: 2,
            background: "linear-gradient(135deg, var(--accent) 0%, transparent 60%)",
            flexShrink: 0,
            cursor: "pointer",
            border: "none",
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.opacity = "1";
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
              background: "var(--bg-elevated)",
              padding: 1,
            }}
          >
            <img
              src="/riad-photo.png"
              alt="Riad Sacroud"
              width={72}
              height={72}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "50%" }}
            />
          </div>
        </button>


        {/* Name & title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
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
              fontSize: "0.65rem",
              fontWeight: 300,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Full-Stack Engineer
          </p>
        </div>

        {/* Availability badge — proper pill with background */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(52, 211, 153, 0.08)",
            border: "1px solid rgba(52, 211, 153, 0.22)",
            borderRadius: "100px",
            padding: "0.3rem 0.65rem",
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              flexShrink: 0,
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              fontWeight: 400,
              color: "var(--green)",
              letterSpacing: "0.04em",
            }}
          >
            Open to work
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div
        className="animate-fade-up delay-2"
        style={{ height: 1, background: "var(--border)", flexShrink: 0 }}
      />

      {/* ── Language note ── */}
      <div className="animate-fade-up delay-2">
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            fontWeight: 300,
            color: "var(--text-muted)",
            letterSpacing: "0.05em",
            lineHeight: 1.7,
          }}
        >
          Ask in English or French —<br />
          language is detected automatically.
        </p>
      </div>

      {/* ── Suggested questions ── */}
      <div
        className="animate-fade-up delay-3"
        style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.55rem",
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "0.15rem",
          }}
        >
          Suggestions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => onSuggestedQuestion(q)}
              onMouseEnter={() => setHoveredChip(i)}
              onMouseLeave={() => setHoveredChip(null)}
              style={{
                background: hoveredChip === i ? "var(--accent-dim)" : "transparent",
                border: "1px solid transparent",
                borderLeft: `2px solid ${hoveredChip === i ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                padding: "0.45rem 0.65rem",
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                fontWeight: 400,
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

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />

      {/* ── Social links + settings ── */}
      <div
        ref={settingsRef}
        className="animate-fade-up delay-4"
        style={{ display: "flex", gap: "0.75rem", alignItems: "center", position: "relative" }}
      >
        {/* Settings popover — appears above the row when gear is clicked */}
        {settingsOpen && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: 0,
              right: 0,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
              boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.25)",
              animation: "fadeUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Section label */}
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.52rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "0.6rem",
            }}>
              Appearance
            </p>

            {/* Dark / Light pill toggle */}
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {(["dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { if (theme !== mode) onToggleTheme(); }}
                  aria-pressed={theme === mode}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    padding: "0.4rem 0",
                    borderRadius: "var(--radius-sm)",
                    border: theme === mode
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    background: theme === mode ? "var(--accent-dim)" : "transparent",
                    color: theme === mode ? "var(--accent)" : "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    fontWeight: 400,
                    letterSpacing: "0.06em",
                    cursor: theme === mode ? "default" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {mode === "dark" ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <line x1="12" y1="2"  x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="22" />
                      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="2"  y1="12" x2="4"  y2="12" />
                      <line x1="20" y1="12" x2="22" y2="12" />
                      <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
                    </svg>
                  )}
                  {mode === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        <a
          href="https://github.com/sacroudr"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Riad Sacroud on GitHub (opens in new tab)"
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
          aria-label="Riad Sacroud on LinkedIn (opens in new tab)"
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
          aria-label="Send email to Riad Sacroud"
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

        {/* Settings gear icon — pushed to far right with marginLeft auto */}
        <button
          onClick={() => setSettingsOpen((prev) => !prev)}
          aria-label="Open settings"
          aria-expanded={settingsOpen}
          title="Settings"
          style={{
            marginLeft: "auto",
            color: settingsOpen ? "var(--accent)" : "var(--text-muted)",
            background: settingsOpen ? "var(--accent-dim)" : "transparent",
            border: settingsOpen ? "1px solid var(--accent)" : "1px solid transparent",
            borderRadius: "var(--radius-sm)",
            padding: "3px",
            lineHeight: 0,
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            if (!settingsOpen) e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            if (!settingsOpen) e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </aside>

      {/* Lightbox — portalled to document.body so it sits outside the <aside>'s
          transform stacking context and truly covers the full viewport. */}
      {mounted && lightboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Riad Sacroud — full-size photo"
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            animation: "fadeIn 0.2s ease forwards",
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.25rem",
              animation: "fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            <img
              src="/riad-photo.png"
              alt="Riad Sacroud"
              style={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--accent)",
                boxShadow: "0 0 0 6px var(--accent-dim), 0 32px 80px rgba(0, 0, 0, 0.7)",
                display: "block",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                color: "rgba(255, 255, 255, 0.35)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Riad Sacroud · Click anywhere to close · Esc
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
