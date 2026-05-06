"use client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
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
            padding: "0.65rem 1rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
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
          fontSize: "0.8rem",
          fontWeight: 300,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
          maxWidth: "85%",
          wordBreak: "break-word",
        }}
      >
        <MarkdownRenderer text={message.content} />
        {message.isStreaming && (
          <span
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
          fontSize: "1.1rem",
          fontWeight: 400,
          color: "var(--text-primary)",
          marginBottom: "0.75rem",
          marginTop: i > 0 ? "1rem" : 0,
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
          fontSize: "0.72rem",
          fontWeight: 500,
          color: "var(--accent)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "0.4rem",
          marginTop: i > 0 ? "1.25rem" : 0,
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
          fontSize: "0.68rem",
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "0.35rem",
          marginTop: i > 0 ? "0.85rem" : 0,
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
              fontSize: "0.65rem",
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

  // Split on bold, italic, code, full URLs, emails, plain domains, and relative PDF paths
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s,)>\]]+|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|(?:[a-zA-Z0-9\-]+\.)+(?:com|app|io|fr|dev|net|org|ai)(\/[^\s,)>\]]*)?|\/[a-zA-Z0-9\-_]+\.pdf)/g;
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
                padding: "0.3rem 0.65rem",
                fontSize: "0.75rem",
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