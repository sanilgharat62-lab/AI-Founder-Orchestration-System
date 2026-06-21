"use client";

import { useState } from "react";
import { AgentResult, AgentName, Citation } from "@/types";

interface AgentCardProps {
  agentName: AgentName;
  title: string;
  emoji: string;
  color: string;
  result?: AgentResult;
}

function renderMarkdown(text: string): string {
  return text
    // headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // table rows
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-\s:]+$/.test(c))) return ''; // separator row
      const isHeader = false;
      return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
    })
    // wrap consecutive <tr> in <table>
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table>$1</table>')
    // unordered list items
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, (m) => `<ul>${m}</ul>`)
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // paragraphs (blank line separated)
    .replace(/\n\n([^<\n])/g, '\n\n<p>$1')
    .replace(/([^>\n])\n\n/g, '$1</p>\n\n')
    // line breaks
    .replace(/\n/g, '<br/>');
}

export default function AgentCard({ agentName, title, emoji, color, result }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const status = result?.status ?? "idle";
  const isJudge = agentName === "judge";

  const statusConfig = {
    idle: { label: "Waiting", dot: "var(--text-muted)", bg: "transparent" },
    running: { label: "Running…", dot: "var(--running)", bg: "rgba(96, 165, 250, 0.06)" },
    done: { label: "Done", dot: "var(--success)", bg: "transparent" },
    error: { label: "Error", dot: "var(--error)", bg: "transparent" },
  }[status];

  const isIdle = status === "idle";

  let judgeData: { overallScore: number; verdict: string } | null = null;
  if (isJudge && status === "done" && result?.output) {
    try {
      const cleaned = result.output.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.overallScore === "number" && typeof parsed.verdict === "string") {
        judgeData = { overallScore: parsed.overallScore, verdict: parsed.verdict };
      }
    } catch {
      // Leave judgeData null; falls back to default rendering below.
    }
  }

  const verdictColor = judgeData?.verdict === "GO" ? "var(--success)" : judgeData?.verdict === "NO-GO" ? "var(--error)" : "var(--warning)";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${status === "running" ? color + "40" : "var(--border)"}`,
        borderRadius: "12px",
        overflow: "hidden",
        transition: "border-color 0.3s, box-shadow 0.3s",
        animation: result ? "fade-in-up 0.35s ease-out" : "none",
        ...(status === "running" && {
          boxShadow: `0 0 20px ${color}18`,
        }),
        opacity: isIdle ? 0.5 : 1,
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: expanded && result?.output ? "1px solid var(--border)" : "none",
          background: statusConfig.bg,
          cursor: status === "done" ? "pointer" : "default",
        }}
        onClick={() => status === "done" && setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Colored icon area */}
          <div
            style={{
              width: "36px",
              height: "36px",
              background: `${color}18`,
              border: `1px solid ${color}30`,
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {status === "running" ? (
              <span
                style={{
                  position: "absolute",
                  inset: "-1px",
                  borderRadius: "9px",
                  border: `2px solid ${color}`,
                  borderTopColor: "transparent",
                  animation: "spin-slow 0.8s linear infinite",
                }}
              />
            ) : null}
            {emoji}
          </div>

          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                lineHeight: 1.3,
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.15rem" }}>
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: statusConfig.dot,
                  display: "inline-block",
                  ...(status === "running" && { animation: "pulse-glow 1.2s ease-in-out infinite" }),
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {statusConfig.label}
                {status === "done" && result?.durationMs && (
                  <> · {(result.durationMs / 1000).toFixed(1)}s</>
                )}
              </span>
            </div>
          </div>
        </div>

        {status === "done" && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            {expanded ? "▲" : "▼"}
          </div>
        )}

        {status === "running" && (
          <div style={{ display: "flex", gap: "3px" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: color,
                  display: "inline-block",
                  animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Running shimmer */}
      {status === "running" && (
        <div style={{ padding: "0.75rem 1.25rem" }}>
          {[80, 60, 90, 50].map((w, i) => (
            <div
              key={i}
              className="shimmer"
              style={{
                height: "10px",
                width: `${w}%`,
                borderRadius: "5px",
                marginBottom: "8px",
              }}
            />
          ))}
        </div>
      )}

      {/* Done preview (collapsed) */}
      {status === "done" && !expanded && result?.output && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(true)}
        >
          {isJudge && judgeData ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {judgeData.overallScore}
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</span>
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: verdictColor,
                  background: `${verdictColor}18`,
                  border: `1px solid ${verdictColor}40`,
                  borderRadius: "999px",
                  padding: "0.2rem 0.6rem",
                  letterSpacing: "0.03em",
                }}
              >
                {judgeData.verdict}
              </span>
            </div>
          ) : (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                margin: 0,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.6,
              }}
            >
              {result.output
                .replace(/#{1,3}\s/g, "")
                .replace(/\*\*/g, "")
                .replace(/\n/g, " ")
                .trim()
                .slice(0, 120)}
              …
            </p>
          )}
          <span
            style={{
              fontSize: "0.72rem",
              color: color,
              marginTop: "0.4rem",
              display: "inline-block",
            }}
          >
            Tap to expand →
          </span>
        </div>
      )}

      {/* Expanded output */}
      {status === "done" && expanded && result?.output && (
        <>
          {isJudge && judgeData ? (
            <JudgeExpanded rawOutput={result.output} />
          ) : (
            <div
              className="agent-output"
              style={{
                padding: "1.25rem",
                maxHeight: "480px",
                overflowY: "auto",
                fontSize: "0.82rem",
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(result.output) }}
            />
          )}
          {!isJudge && result.citations && result.citations.length > 0 && (
            <CitationsFooter citations={result.citations} color={color} />
          )}
        </>
      )}

      {/* Error state */}
      {status === "error" && (
        <div style={{ padding: "0.75rem 1.25rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--error)", margin: 0 }}>
            {result?.error || "An error occurred"}
          </p>
        </div>
      )}
    </div>
  );
}

interface JudgeDimension {
  key: string;
  label: string;
  score: number;
  rationale: string;
}

interface JudgeCritique {
  agent: string;
  strengths: string[];
  weaknesses: string[];
  confidence: number;
}

function JudgeExpanded({ rawOutput }: { rawOutput: string }) {
  let data: {
    overallScore: number;
    verdict: string;
    dimensions: JudgeDimension[];
    critiques: JudgeCritique[];
    topRisks: string[];
    topActions: string[];
  } | null = null;

  try {
    const cleaned = rawOutput.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    data = JSON.parse(cleaned);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div style={{ padding: "1.25rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
        Could not parse the judge&apos;s verdict. Raw output:
        <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{rawOutput}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.25rem", maxHeight: "520px", overflowY: "auto", fontSize: "0.82rem" }}>
      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
        {data.dimensions.map((d) => (
          <div key={d.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)", fontWeight: 600 }}>{d.label}</span>
              <span style={{ fontSize: "0.76rem", color: "var(--text-primary)", fontWeight: 700 }}>{d.score}/10</span>
            </div>
            <div style={{ height: "5px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(d.score / 10) * 100}%`,
                  background: d.score >= 7 ? "var(--success)" : d.score >= 4 ? "var(--warning)" : "var(--error)",
                  borderRadius: "999px",
                }}
              />
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>{d.rationale}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--error)", margin: "0 0 0.4rem" }}>Top Risks</p>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {data.topRisks.map((r, i) => (
              <li key={i} style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem", lineHeight: 1.45 }}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)", margin: "0 0 0.4rem" }}>Top Actions</p>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {data.topActions.map((a, i) => (
              <li key={i} style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem", lineHeight: 1.45 }}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
        Per-Agent Critique
      </p>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {data.critiques.map((c) => (
          <div key={c.agent} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.65rem 0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {c.agent.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Confidence {c.confidence}/100</span>
            </div>
            {c.strengths.length > 0 && (
              <p style={{ fontSize: "0.7rem", color: "var(--success)", margin: "0 0 0.2rem" }}>
                + {c.strengths.join(" · ")}
              </p>
            )}
            {c.weaknesses.length > 0 && (
              <p style={{ fontSize: "0.7rem", color: "var(--error)", margin: 0 }}>
                − {c.weaknesses.join(" · ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CitationsFooter({ citations, color }: { citations: Citation[]; color: string }) {
  return (
    <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border)" }}>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 0.4rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Sources
      </p>
      <div style={{ display: "grid", gap: "0.3rem" }}>
        {citations.map((c) => (
          <a
            key={c.index}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              display: "flex",
              gap: "0.4rem",
            }}
          >
            <span style={{ color, fontWeight: 700, flexShrink: 0 }}>[{c.index}]</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
