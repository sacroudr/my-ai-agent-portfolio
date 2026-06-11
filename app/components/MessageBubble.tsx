"use client";

import ContactForm from "./ContactForm";
import CalendarButton from "./CalendarButton";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  followUps?: string[];
  confidence?: "high" | "medium" | "low";
  language?: "fr" | "en";
}

interface MessageBubbleProps {
  message: Message;
  onFollowUp?: (question: string) => void;
}

export default function MessageBubble({ message, onFollowUp }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          animation: "fadeUp 0.2s ease-out forwards",
        }}
      >
        <div
          style={{
            maxWidth: "70%",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius) var(--radius) 2px var(--radius)",
            padding: "var(--space-2) var(--space-4)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Detect and strip trigger tokens from content
  const showContactForm = message.content.includes("[SHOW_CONTACT_FORM]");
  const showCalendar = message.content.includes("[SHOW_CALENDAR]");
  const cleanContent = message.content
    .replace(/\[SHOW_CONTACT_FORM\]/g, "")
    .replace(/\[SHOW_CALENDAR\]/g, "")
    .trim();

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        animation: "fadeUp 0.2s ease-out forwards",
      }}
    >
      {/* Agent dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent)",
          flexShrink: 0,
          marginTop: "0.55rem",
        }}
      />

      {/* Agent text */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          fontWeight: 300,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
          maxWidth: "var(--reading-max)",
          wordBreak: "break-word",
        }}
      >
        <MarkdownRenderer text={cleanContent} />
        {message.isStreaming && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "1ch",
              color: "var(--accent)",
              animation: "blink 0.8s step-end infinite",
              fontWeight: 400,
            }}
          >
            ▊
          </span>
        )}

        {/* Confidence indicator — only shown on low/medium, subtly */}
        {!message.isStreaming && message.confidence && message.confidence !== "high" && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
            marginTop: "var(--space-2)",
            padding: "0.2rem var(--space-2)",
            borderRadius: "var(--radius-pill)",
            border: `1px solid ${message.confidence === "low" ? "var(--amber-border)" : "var(--accent-border)"}`,
            background: message.confidence === "low" ? "var(--amber-dim)" : "var(--accent-dim)",
          }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: message.confidence === "low" ? "var(--amber)" : "var(--accent)",
              opacity: 0.8,
            }} />
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-2xs)",
              color: message.confidence === "low" ? "var(--amber)" : "var(--text-secondary)",
              letterSpacing: "0.06em",
            }}>
              {message.confidence === "low"
                ? "Limited context — answer may be incomplete"
                : "Partial context"}
            </span>
          </div>
        )}

        {/* Follow-up suggestion chips */}
        {!message.isStreaming && message.followUps && message.followUps.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            marginTop: "1rem",
          }}>
            {message.followUps.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp?.(q)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius-pill)",
                  padding: "0.3rem var(--space-3)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                  e.currentTarget.style.background = "var(--accent-dim)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Inline contact form */}
        {!message.isStreaming && showContactForm && (
          <ContactForm language={message.language || "en"} />
        )}

        {/* Calendar booking button */}
        {!message.isStreaming && showCalendar && (
          <CalendarButton language={message.language || "en"} />
        )}
      </div>
    </div>
  );
}

function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <div key={i} style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: 400,
          color: "var(--text-primary)",
          marginBottom: "var(--space-3)",
          marginTop: i > 0 ? "var(--space-4)" : 0,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
        }}>
          {renderInline(line.slice(2))}
        </div>
      );
    }
    // H2
    else if (line.startsWith("## ")) {
      elements.push(
        <div key={i} style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          color: "var(--accent)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "var(--space-2)",
          marginTop: i > 0 ? "var(--space-5)" : 0,
        }}>
          {renderInline(line.slice(3))}
        </div>
      );
    }
    // H3
    else if (line.startsWith("### ")) {
      elements.push(
        <div key={i} style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "var(--space-1)",
          marginTop: i > 0 ? "var(--space-3)" : 0,
          opacity: 0.8,
        }}>
          {renderInline(line.slice(4))}
        </div>
      );
    }
    // HR
    else if (line.trim() === "---") {
      elements.push(
        <div key={i} style={{
          height: 1,
          background: "var(--border)",
          margin: "1rem 0",
        }} />
      );
    }
    // Bullet list item (- or *)
    else if (line.match(/^[\-\*] /)) {
      elements.push(
        <div key={i} style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "flex-start",
          marginBottom: "0.25rem",
          paddingLeft: "0.25rem",
        }}>
          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: "0.15rem", fontSize: "0.6rem" }}>▸</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      const match = line.match(/^(\d+)\. (.*)/);
      if (match) {
        elements.push(
          <div key={i} style={{
            display: "flex",
            gap: "0.6rem",
            alignItems: "flex-start",
            marginBottom: "0.25rem",
            paddingLeft: "0.25rem",
          }}>
            <span style={{
              color: "var(--accent)",
              flexShrink: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              marginTop: "0.1rem",
              minWidth: "1.2rem",
            }}>
              {match[1]}.
            </span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    }
    // Empty line — spacing
    else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "0.5rem" }} />);
    }
    // Normal paragraph
    else {
      elements.push(
        <div key={i} style={{ marginBottom: "0.1rem" }}>
          {renderInline(line)}
        </div>
      );
    }

    i++;
  }

  return <>{elements}</>;
}

// Renders inline markdown: **bold**, *italic*, `code`, URLs, emails
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split on markdown links, bold, italic, code, full URLs, emails, plain domains, PDF paths, phone numbers
  const tokenRegex = /(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s,)>\]]+|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|(?:[a-zA-Z0-9\-]+\.)+(?:com|app|io|fr|dev|net|org|ai)(\/[^\s,)>\]]*)?|\/[a-zA-Z0-9\-_]+\.pdf|\+\d[\d\s]{7,14}\d)/g;
  const parts = text.split(tokenRegex).filter(Boolean);

  return (
    <>
      {parts.map((part, i) => {
        // Bold
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Italic
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <em key={i} style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
              {part.slice(1, -1)}
            </em>
          );
        }
        // Inline code
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "0.05em 0.35em",
              fontSize: "0.85em",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
            }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        // Relative PDF paths (/resume-en.pdf, /resume-fr.pdf)
        if (part.startsWith("/") && part.endsWith(".pdf")) {
          const label = part.includes("-fr") ? "📄 Télécharger le CV (FR)" : "📄 Download Resume (EN)";
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...linkStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius-sm)",
                padding: "0.3rem var(--space-2)",
                fontSize: "var(--text-xs)",
                textDecoration: "none",
                borderBottom: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.color = "var(--bg-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent-dim)";
                e.currentTarget.style.color = "var(--accent)";
              }}
            >
              {label}
            </a>
          );
        }
        // Phone number
        if (part.match(/^\+\d[\d\s]{7,14}\d$/)) {
          const digits = part.replace(/\s/g, "");
          return (
            <a
              key={i}
              href={`tel:${digits}`}
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
            >
              {part}
            </a>
          );
        }
        // Markdown link [text](url)
        if (part.match(/^\[[^\]]+\]\(https?:\/\/[^)]+\)$/)) {
          const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
          if (match) {
            return (
              <a
                key={i}
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
              >
                {match[1]}
              </a>
            );
          }
        }
        // Full URL (https://...)
        if (part.startsWith("http://") || part.startsWith("https://")) {
          const label = part
            .replace("https://", "")
            .replace("http://", "")
            .replace(/\/$/, "");
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
            >
              {label}
            </a>
          );
        }
        // Plain domain patterns without https (e.g. github.com/sacroudr, linkedin.com/in/..., linkpulse-phi.vercel.app)
        if (part.match(/^([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}(\/[^\s,)>\]]*)?$/) && !part.includes('@')) {
          return (
            <a
              key={i}
              href={`https://${part}`}
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
            >
              {part}
            </a>
          );
        }
        // Email
        if (part.match(/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/)) {
          return (
            <a
              key={i}
              href={`mailto:${part}`}
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--accent)",
  textDecoration: "none",
  borderBottom: "1px solid var(--accent-dim)",
  paddingBottom: "1px",
  transition: "color 0.15s ease",
  cursor: "pointer",
};