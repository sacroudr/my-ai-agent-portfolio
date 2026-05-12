"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  {
    href: "/admin/conversations",
    label: "Conversations",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: "/admin/usage",
    label: "Token Usage",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const W = collapsed ? 52 : 220;

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  };

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>

      {/* ── Fixed sidebar ─────────────────────────────────────── */}
      <aside style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: W,
        background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 250ms ease",
        overflow: "hidden",
        zIndex: 100,
      }}>

        {/* Header */}
        <div style={{
          height: 56,
          padding: "0 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          overflow: "hidden",
        }}>
          {/* Logo mark */}
          <div style={{
            width: 28,
            height: 28,
            flexShrink: 0,
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--accent)",
            userSelect: "none",
          }}>
            A
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}>
                Admin
              </p>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.55rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                letterSpacing: "0.05em",
              }}>
                AI Portfolio
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          paddingTop: 16,
          paddingBottom: 8,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
        }}>
          {!collapsed && (
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.52rem",
              color: "var(--text-muted)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "0 12px",
              marginBottom: 8,
              userSelect: "none",
            }}>
              Navigation
            </p>
          )}

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 36,
                  padding: "0 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  background: isActive ? "var(--bg-subtle)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  textDecoration: "none",
                  transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-subtle)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{item.icon}</span>
                {!collapsed && (
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.03em",
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 8,
          paddingBottom: 8,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexShrink: 0,
        }}>
          <Link
            href="/"
            title={collapsed ? "Back to Portfolio" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 36,
              padding: "0 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "background 150ms ease, color 150ms ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-subtle)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            {!collapsed && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.03em" }}>
                Back to Portfolio
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 36,
              padding: "0 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              width: "100%",
              transition: "background 150ms ease, color 150ms ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#EF4444";
              e.currentTarget.style.background = "rgba(239,68,68,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.03em" }}>
                Logout
              </span>
            )}
          </button>
        </div>

        {/* Collapse toggle — very bottom, centered */}
        <div style={{
          padding: "10px 0",
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              transition: "border-color 150ms ease, color 150ms ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {collapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main style={{
        marginLeft: W,
        height: "100vh",
        overflowY: "auto",
        padding: "32px 40px",
        transition: "margin-left 250ms ease",
        background: "var(--bg-base)",
      }}>
        {children}
      </main>
    </div>
  );
}
