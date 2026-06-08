"use client";

import { Message } from "./MessageBubble";

interface ExportButtonProps {
  messages: Message[];
  language: "fr" | "en";
}

const LABELS = {
  en: { button: "Export PDF", empty: "No conversation to export" },
  fr: { button: "Exporter PDF", empty: "Aucune conversation à exporter" },
};

export default function ExportButton({ messages, language }: ExportButtonProps) {
  const l = LABELS[language];

  const handleExport = () => {
    if (messages.length === 0) return;

    // Clean content — strip trigger tokens
    const cleanMessages = messages.map((m) => ({
      ...m,
      content: m.content
        .replace(/\[SHOW_CONTACT_FORM\]/g, "")
        .replace(/\[SHOW_CALENDAR\]/g, "")
        .trim(),
    }));

    const date = new Date().toLocaleDateString(
      language === "fr" ? "fr-FR" : "en-GB",
      { day: "2-digit", month: "long", year: "numeric" }
    );

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Riad Sacroud — AI Portfolio · ${date}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: 'Outfit', sans-serif;
            background: #ffffff;
            color: #09090b;
            padding: 48px 56px;
            max-width: 720px;
            margin: 0 auto;
            font-size: 13px;
            line-height: 1.6;
          }

          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 2px solid #06B6D4;
            margin-bottom: 32px;
          }

          .header-left h1 {
            font-family: 'DM Serif Display', serif;
            font-size: 22px;
            font-weight: 400;
            color: #09090b;
            margin-bottom: 4px;
          }

          .header-left p {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: #71717a;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .header-right {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: #71717a;
            text-align: right;
            line-height: 1.8;
          }

          .accent { color: #06B6D4; }

          /* Messages */
          .messages {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .message { display: flex; flex-direction: column; gap: 4px; }

          .message-meta {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .message-meta.user { color: #06B6D4; text-align: right; }
          .message-meta.assistant { color: #a1a1aa; }

          .bubble {
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 12.5px;
            line-height: 1.7;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .bubble.user {
            background: #f0fdfb;
            border: 1px solid rgba(6,182,212,0.2);
            border-radius: 10px 10px 2px 10px;
            margin-left: 20%;
            font-family: 'Outfit', sans-serif;
          }

          .bubble.assistant {
            background: #fafafa;
            border-left: 3px solid #06B6D4;
            border-radius: 0 10px 10px 10px;
            padding-left: 14px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 300;
            font-size: 11.5px;
            color: #3f3f46;
            margin-right: 10%;
          }

          /* Footer */
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e4e4e7;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .footer p {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            color: #a1a1aa;
            letter-spacing: 0.06em;
          }

          @media print {
            body { padding: 32px 40px; }
            .header { margin-bottom: 24px; }
            .messages { gap: 16px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <h1>Riad Sacroud</h1>
            <p>AI Portfolio · Conversation Export</p>
          </div>
          <div class="header-right">
            <p>${date}</p>
            <p>${cleanMessages.length} message${cleanMessages.length > 1 ? "s" : ""}</p>
            <p class="accent">sacroudr@gmail.com</p>
          </div>
        </div>

        <div class="messages">
          ${cleanMessages
            .filter((m) => m.content.trim().length > 0)
            .map((m) => `
              <div class="message">
                <div class="message-meta ${m.role}">
                  ${m.role === "user"
                    ? (language === "fr" ? "Vous" : "You")
                    : "Riad's AI"}
                </div>
                <div class="bubble ${m.role}">${escapeHtml(m.content)}</div>
              </div>
            `)
            .join("")}
        </div>

        <div class="footer">
          <p>Generated by Riad Sacroud's AI Portfolio Agent</p>
          <p>github.com/sacroudr · linkedin.com/in/riad-sacroud-7a5b73166</p>
        </div>
      </body>
      </html>
    `;

    // Open in a new window and trigger print dialog
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for fonts to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  if (messages.length === 0) return null;

  return (
    <button
      onClick={handleExport}
      title={l.button}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        background: "transparent",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-sm)",
        padding: "0.35rem 0.75rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.62rem",
        letterSpacing: "0.06em",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--accent)";
        e.currentTarget.style.background = "var(--accent-dim)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {l.button}
    </button>
  );
}

// Escape HTML special chars for safe injection into the print template
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}