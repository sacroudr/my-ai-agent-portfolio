"use client";

const CAL_URL = "https://cal.com/riad-sacroud-betpsz/30min";

interface CalendarButtonProps {
  language: "fr" | "en";
}

const LABELS = {
  en: {
    title: "Schedule a call",
    subtitle: "30 min · Google Meet · Free",
    cta: "Book a slot →",
  },
  fr: {
    title: "Planifier un appel",
    subtitle: "30 min · Google Meet · Gratuit",
    cta: "Réserver un créneau →",
  },
};

export default function CalendarButton({ language }: CalendarButtonProps) {
  const l = LABELS[language];

  return (
    <div style={{
      marginTop: "var(--space-3)",
      padding: "var(--space-4) var(--space-4)",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      flexWrap: "wrap",
    }}>
      {/* Left — icon + text */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {/* Calendar icon */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: "var(--radius-sm)",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        {/* Text */}
        <div>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            color: "var(--text-primary)",
            fontWeight: 500,
            marginBottom: "0.15rem",
          }}>
            {l.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {/* Google Meet badge */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M15 8v8H9V8h6zm6 4l-4-2.5v5L21 12z" fill="var(--text-muted)" />
            </svg>
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-2xs)",
              color: "var(--text-muted)",
              letterSpacing: "0.04em",
            }}>
              {l.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* CTA button */}
      <a
        href={CAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "var(--accent)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "0.55rem 1.1rem",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "0.06em",
          color: "var(--bg-base)",
          textDecoration: "none",
          whiteSpace: "nowrap",
          transition: "all var(--dur-fast) ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.03)";
          e.currentTarget.style.boxShadow = "0 0 16px var(--accent-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {l.cta}
      </a>
    </div>
  );
}