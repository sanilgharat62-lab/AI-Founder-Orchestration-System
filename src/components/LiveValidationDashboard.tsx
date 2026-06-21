"use client";

import { AgentResult, AgentName } from "@/types";

interface LiveValidationDashboardProps {
  agents: Record<AgentName, AgentResult>;
  agentOrder: AgentName[];
  running: boolean;
  judgeMode: boolean;
}

export default function LiveValidationDashboard({
  agents,
  agentOrder,
  running,
  judgeMode,
}: LiveValidationDashboardProps) {
  const fullOrder = judgeMode ? [...agentOrder, "judge" as AgentName] : agentOrder;
  const total = fullOrder.length;
  const done = fullOrder.filter((a) => agents[a]?.status === "done").length;
  const errored = fullOrder.filter((a) => agents[a]?.status === "error").length;
  const totalDurationMs = fullOrder.reduce((sum, a) => sum + (agents[a]?.durationMs ?? 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const currentAgent = fullOrder.find((a) => agents[a]?.status === "running");

  if (done === 0 && !running) return null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        marginBottom: "1.25rem",
        animation: "fade-in-up 0.35s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.95rem" }}>📡</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Live Validation
          </span>
          {running && currentAgent && (
            <span style={{ fontSize: "0.72rem", color: "var(--running)" }}>
              · running {currentAgent.replace(/_/g, " ")}…
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          {errored > 0 && (
            <span style={{ fontSize: "0.72rem", color: "var(--error)" }}>{errored} error{errored !== 1 ? "s" : ""}</span>
          )}
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {done}/{total} agents
          </span>
          {totalDurationMs > 0 && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {(totalDurationMs / 1000).toFixed(1)}s elapsed
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: "6px", background: "var(--border)", borderRadius: "999px", overflow: "hidden", marginBottom: "0.85rem" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: errored > 0 ? "var(--warning)" : "var(--accent)",
            borderRadius: "999px",
            transition: "width 0.4s ease-out",
          }}
        />
      </div>

      {/* Per-agent status chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {fullOrder.map((a) => {
          const result = agents[a];
          const status = result?.status ?? "idle";
          const dotColor =
            status === "done" ? "var(--success)" : status === "running" ? "var(--running)" : status === "error" ? "var(--error)" : "var(--text-muted)";
          return (
            <div
              key={a}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "999px",
                padding: "0.25rem 0.6rem",
                fontSize: "0.68rem",
                color: status === "idle" ? "var(--text-muted)" : "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: dotColor,
                  ...(status === "running" && { animation: "pulse-glow 1.2s ease-in-out infinite" }),
                }}
              />
              {a.replace(/_/g, " ")}
              {status === "done" && result?.durationMs && (
                <span style={{ color: "var(--text-muted)" }}>· {(result.durationMs / 1000).toFixed(1)}s</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
