"use client";

import { useState } from "react";

interface ContactFormProps {
  language: "fr" | "en";
  onSuccess?: () => void;
}

const LABELS = {
  en: {
    title: "Send a message to Riad",
    subtitle: "He'll get back to you directly by email.",
    name: "Your name",
    email: "Your email",
    message: "Your message",
    send: "Send message",
    sending: "Sending...",
    success: "Message sent! Riad will get back to you shortly.",
    error: "Something went wrong. Please try again.",
    namePlaceholder: "Jane Smith",
    emailPlaceholder: "jane@company.com",
    messagePlaceholder: "Hi Riad, I came across your portfolio and...",
  },
  fr: {
    title: "Envoyer un message à Riad",
    subtitle: "Il vous répondra directement par email.",
    name: "Votre nom",
    email: "Votre email",
    message: "Votre message",
    send: "Envoyer",
    sending: "Envoi en cours...",
    success: "Message envoyé ! Riad vous répondra rapidement.",
    error: "Une erreur s'est produite. Veuillez réessayer.",
    namePlaceholder: "Jean Dupont",
    emailPlaceholder: "jean@entreprise.com",
    messagePlaceholder: "Bonjour Riad, j'ai découvert votre portfolio et...",
  },
};

export default function ContactForm({ language, onSuccess }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const l = LABELS[language];

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    if (status === "sending" || status === "success") return;

    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setStatus("success");
        onSuccess?.();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{
        marginTop: "var(--space-3)",
        padding: "var(--space-4) var(--space-4)",
        background: "var(--green-dim)",
        border: "1px solid var(--green-border)",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--green)",
          lineHeight: 1.5,
        }}>
          {l.success}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: "var(--space-3)",
      padding: "var(--space-5)",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--radius)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)",
    }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-3)" }}>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-md)",
          color: "var(--text-primary)",
          marginBottom: "0.2rem",
        }}>
          {l.title}
        </p>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          color: "var(--text-muted)",
          letterSpacing: "0.04em",
        }}>
          {l.subtitle}
        </p>
      </div>

      {/* Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{
            fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)",
            color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {l.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={l.namePlaceholder}
            disabled={status === "sending"}
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "0.55rem 0.75rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
              outline: "none",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              width: "100%",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{
            fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)",
            color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {l.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={l.emailPlaceholder}
            disabled={status === "sending"}
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "0.55rem 0.75rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
              outline: "none",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              width: "100%",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Message */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)",
          color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          {l.message}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={l.messagePlaceholder}
          disabled={status === "sending"}
          rows={3}
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            padding: "0.55rem 0.75rem",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--text-primary)",
            outline: "none",
            resize: "none",
            lineHeight: 1.6,
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            width: "100%",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-glow)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-strong)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)",
          color: "var(--red)", letterSpacing: "0.04em",
        }}>
          {l.error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !email.trim() || !message.trim() || status === "sending"}
        style={{
          background: name && email && message && status !== "sending"
            ? "var(--accent)" : "var(--bg-subtle)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          padding: "0.65rem 1.25rem",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          letterSpacing: "0.08em",
          color: name && email && message && status !== "sending"
            ? "var(--bg-base)" : "var(--text-muted)",
          cursor: name && email && message && status !== "sending" ? "pointer" : "default",
          transition: "all 0.15s ease",
          alignSelf: "flex-end",
        }}
        onMouseEnter={(e) => {
          if (name && email && message && status !== "sending") {
            e.currentTarget.style.transform = "scale(1.02)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {status === "sending" ? l.sending : l.send}
      </button>
    </div>
  );
}