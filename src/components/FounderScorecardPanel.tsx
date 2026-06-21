"use client";

import { FounderScorecard } from "@/types";

interface FounderScorecardPanelProps {
  scorecard: FounderScorecard | null;
  startupName: string | null;
}

export default function FounderScorecardPanel({ scorecard, startupName }: FounderScorecardPanelProps) {
  if (!scorecard) return null;

  const verdictColor =
    scorecard.verdict === "GO" ? "var(--success)" : scorecard.verdict === "NO-GO" ? "var(--error)" : "var(--warning)";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${verdictColor}40`,
        borderRadius: "14px",
        padding: "1.5rem",
        marginTop: "1.5rem",
        animation: "fade-in-up 0.4s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.3rem" }}>🏆</span>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Founder Scorecard
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {startupName ? `${startupName} · ` : ""}Judge Mode verdict
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
              {scorecard.overallScore}
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
            </div>
          </div>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: verdictColor,
              background: `${verdictColor}18`,
              border: `1px solid ${verdictColor}40`,
              borderRadius: "999px",
              padding: "0.35rem 0.85rem",
              letterSpacing: "0.03em",
            }}
          >
            {scorecard.verdict}
          </span>
        </div>
      </div>

      {/* Dimension bars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {scorecard.dimensions.map((d) => (
          <div key={d.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 600 }}>{d.label}</span>
              <span style={{ fontSize: "0.74rem", color: "var(--text-primary)", fontWeight: 700 }}>{d.score}/10</span>
            </div>
            <div style={{ height: "6px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(d.score / 10) * 100}%`,
                  background: d.score >= 7 ? "var(--success)" : d.score >= 4 ? "var(--warning)" : "var(--error)",
                  borderRadius: "999px",
                  transition: "width 0.6s ease-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Risks & actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        <div>
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--error)", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            ⚠️ Top Risks
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {scorecard.topRisks.map((r, i) => (
              <li key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.4rem", lineHeight: 1.5 }}>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--success)", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            ✅ Top Actions
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {scorecard.topActions.map((a, i) => (
              <li key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.4rem", lineHeight: 1.5 }}>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
