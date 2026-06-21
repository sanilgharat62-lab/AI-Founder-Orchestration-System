"use client";

import { useEffect, useState } from "react";
import { MemoryStore } from "@/types";

interface MemorySidebarProps {
  onClose: () => void;
}

export default function MemorySidebar({ onClose }: MemorySidebarProps) {
  const [sessions, setSessions] = useState<MemoryStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 200,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(400px, 90vw)",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          animation: "fade-in-up 0.2s ease-out",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              Session History
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {sessions.length} saved{" "}
              {sessions.length === 1 ? "session" : "sessions"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              Loading…
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div
              style={{
                padding: "3rem 1rem",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📭</div>
              No sessions yet. Launch your first startup idea!
            </div>
          )}

          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {session.startupName}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    marginLeft: "0.5rem",
                  }}
                >
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p
                style={{
                  margin: "0 0 0.65rem",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {session.idea}
              </p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {Object.keys(session.agentOutputs).map((agent) => (
                  <span
                    key={agent}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      padding: "0.1rem 0.45rem",
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    ✓ {agent.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              <div
                style={{
                  marginTop: "0.65rem",
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                ID: {session.id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
