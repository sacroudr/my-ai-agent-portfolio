"use client";

import { useEffect, useState } from "react";

interface WelcomePageProps {
  onEnter: () => void;
}

const QUOTE = "I may not have every answer, but I know how to find them.";
const QUOTE_FR_BEFORE = "Je n'ai peut-être pas toutes les réponses, mais je sais comment les ";
const QUOTE_FR_HIGHLIGHT = "trouver";
const QUOTE_FR_AFTER = ".";
const WORDS = QUOTE.split(" ");

// The English word to highlight in accent color
const HIGHLIGHT_WORD = "find";

export default function WelcomePage({ onEnter }: WelcomePageProps) {
  const [visibleWords, setVisibleWords] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Reveal words one by one
  useEffect(() => {
    if (visibleWords < WORDS.length) {
      const timeout = setTimeout(() => {
        setVisibleWords((v) => v + 1);
      }, 90);
      return () => clearTimeout(timeout);
    } else {
      // After last word, show meta then CTA
      const metaTimeout = setTimeout(() => setShowMeta(true), 300);
      const ctaTimeout = setTimeout(() => setShowCTA(true), 600);
      return () => {
        clearTimeout(metaTimeout);
        clearTimeout(ctaTimeout);
      };
    }
  }, [visibleWords]);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(onEnter, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(0.98)" : "scale(1)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        overflow: "hidden",
        padding: "2rem",
      }}
    >
      {/* Ambient background blobs */}
      <div style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "20%",
          left: "15%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(var(--accent-rgb), 0.06) 0%, transparent 70%)",
          animation: "blob-drift-1 12s var(--ease-inout) infinite",
        }} />
        <div style={{
          position: "absolute",
          bottom: "20%",
          right: "15%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(var(--accent-rgb), 0.04) 0%, transparent 70%)",
          animation: "blob-drift-2 16s var(--ease-inout) infinite",
        }} />
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(var(--accent-rgb), 0.03) 0%, transparent 70%)",
          animation: "blob-drift-3 20s var(--ease-inout) infinite",
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative",
        maxWidth: 640,
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2.5rem",
      }}>

        {/* Label */}
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "0.25em",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          opacity: showMeta ? 1 : 0,
          transform: showMeta ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          Riad Sacroud · AI Portfolio
        </div>

        {/* Quote */}
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
          fontStyle: "italic",
          color: "var(--text-primary)",
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
        }}>
          {WORDS.map((word, i) => {
            // Strip trailing punctuation to match the highlight word
            const cleanWord = word.replace(/[.,!?]/g, "").toLowerCase();
            const isHighlight = cleanWord === HIGHLIGHT_WORD;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: "0.3em",
                  opacity: i < visibleWords ? 1 : 0,
                  transform: i < visibleWords ? "translateY(0)" : "translateY(14px)",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                  color: isHighlight ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* French translation */}
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1rem, 2.4vw, 1.3rem)",
          fontStyle: "italic",
          color: "var(--text-secondary)",
          lineHeight: 1.45,
          letterSpacing: "-0.01em",
          opacity: showMeta ? 1 : 0,
          transform: showMeta ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          {QUOTE_FR_BEFORE}
          <span style={{ color: "var(--accent)" }}>{QUOTE_FR_HIGHLIGHT}</span>
          {QUOTE_FR_AFTER}
        </div>

        {/* Accent line */}
        <div style={{
          width: showMeta ? 48 : 0,
          height: 1,
          background: "var(--accent)",
          opacity: 0.5,
          transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }} />

        {/* CTA Button */}
        <button
          onClick={handleEnter}
          style={{
            opacity: showCTA ? 1 : 0,
            transform: showCTA ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease, transform 0.5s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
            background: "transparent",
            border: "1px solid var(--accent)",
            borderRadius: "2px",
            padding: "0.8rem 2.2rem",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-xs)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent)",
            cursor: showCTA ? "pointer" : "default",
            pointerEvents: showCTA ? "auto" : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-dim)";
            e.currentTarget.style.boxShadow = "0 0 24px var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.boxShadow = "none";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Ask me anything →
        </button>

        {/* Hint */}
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          opacity: showCTA ? 0.6 : 0,
          transition: "opacity 0.5s ease 0.2s",
        }}>
          Available in English and French
        </p>
      </div>
    </div>
  );
}