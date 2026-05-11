"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/conversations");
    } else {
      setError("Invalid password");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-mono)",
    }}>
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius)",
        padding: "2.5rem",
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.4rem",
            color: "var(--text-primary)",
            marginBottom: "0.25rem",
          }}>
            Admin
          </h1>
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            AI PORTFOLIO · DASHBOARD
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem 1rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--text-primary)",
              outline: "none",
              width: "100%",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />

          {error && (
            <p style={{ fontSize: "0.7rem", color: "#EF4444", letterSpacing: "0.04em" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              background: password && !loading ? "var(--accent)" : "var(--bg-subtle)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              letterSpacing: "0.08em",
              color: password && !loading ? "var(--bg-base)" : "var(--text-muted)",
              cursor: password && !loading ? "pointer" : "default",
              transition: "all 0.15s ease",
            }}
          >
            {loading ? "Verifying..." : "Enter →"}
          </button>
        </form>
      </div>
    </div>
  );
}