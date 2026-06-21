"use client";

import { useState, useRef, useEffect } from "react";
import { StreamEvent, AgentResult, AgentName, FounderScorecard } from "@/types";
import AgentCard from "@/components/AgentCard";
import IdeaInput from "@/components/IdeaInput";
import Header from "@/components/Header";
import MemorySidebar from "@/components/MemorySidebar";
import ToolsPanel from "@/components/ToolsPanel";
import LiveValidationDashboard from "@/components/LiveValidationDashboard";
import FounderScorecardPanel from "@/components/FounderScorecardPanel";

const AGENT_META: Record<AgentName, { title: string; emoji: string; color: string }> = {
  startup_advisor: { title: "Startup Advisor", emoji: "🎯", color: "#f97316" },
  market_research: { title: "Market Research", emoji: "📊", color: "#3b82f6" },
  product_manager: { title: "Product Manager", emoji: "📋", color: "#8b5cf6" },
  software_architect: { title: "Software Architect", emoji: "🏗️", color: "#14b8a6" },
  engineering_manager: { title: "Engineering Manager", emoji: "⚙️", color: "#f59e0b" },
  marketing_agent: { title: "Marketing Agent", emoji: "📣", color: "#ec4899" },
  judge: { title: "Judge", emoji: "⚖️", color: "#facc15" },
};

const AGENT_ORDER: AgentName[] = [
  "startup_advisor",
  "market_research",
  "product_manager",
  "software_architect",
  "engineering_manager",
  "marketing_agent",
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [running, setRunning] = useState(false);
  const [agents, setAgents] = useState<Record<AgentName, AgentResult>>({} as Record<AgentName, AgentResult>);
  const [startupName, setStartupName] = useState<string | null>(null);
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [judgeMode, setJudgeMode] = useState(false);
  const [scorecard, setScorecard] = useState<FounderScorecard | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasResults = Object.keys(agents).length > 0;

  const resetAgents = () => {
    setAgents({} as Record<AgentName, AgentResult>);
    setStartupName(null);
    setMemoryId(null);
    setScorecard(null);
  };

  async function handleSubmit(submittedIdea: string) {
    if (!submittedIdea.trim() || running) return;
    resetAgents();
    setRunning(true);

    // Scroll to results after short delay
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: submittedIdea, judgeMode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") console.error(err);
    } finally {
      setRunning(false);
    }
  }

  function handleEvent(event: StreamEvent) {
    if (event.type === "agent_start") {
      setAgents((prev) => ({
        ...prev,
        [event.agent]: {
          agent: event.agent,
          title: event.title,
          status: "running",
        },
      }));
    } else if (event.type === "agent_done") {
      setAgents((prev) => ({
        ...prev,
        [event.agent]: {
          agent: event.agent,
          title: event.title,
          status: "done",
          output: event.output,
          sections: event.sections,
          durationMs: event.durationMs,
          citations: event.citations,
        },
      }));
    } else if (event.type === "agent_error") {
      setAgents((prev) => ({
        ...prev,
        [event.agent]: {
          agent: event.agent,
          title: event.title,
          status: "error",
          error: event.error,
        },
      }));
    } else if (event.type === "scorecard_done") {
      setScorecard(event.scorecard);
    } else if (event.type === "orchestrator_done") {
      setStartupName(event.startupName);
      setMemoryId(event.memoryId);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-grid" style={{ background: "var(--bg)" }}>
      {/* Ambient gradient */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at center, rgba(124,106,247,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Header
          onHistoryClick={() => setShowSidebar(true)}
          startupName={startupName}
          memoryId={memoryId}
        />

        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
          {/* Hero section */}
          {!hasResults && !running && (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 0 3rem",
                animation: "fade-in-up 0.5s ease-out",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "100px",
                  padding: "0.35rem 1rem",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginBottom: "2rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--success)",
                    display: "inline-block",
                  }}
                />
                6 AI Agents · Live Orchestration
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  margin: "0 0 1.25rem",
                  color: "var(--text-primary)",
                }}
              >
                Your entire founding team.
                <br />
                <span style={{ color: "var(--accent)" }}>Powered by AI.</span>
              </h1>

              <p
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-secondary)",
                  maxWidth: "520px",
                  margin: "0 auto 3rem",
                  lineHeight: 1.7,
                }}
              >
                Enter your startup idea. Six specialized agents validate, research, plan,
                architect, engineer, and market it — simultaneously.
              </p>

              {/* Agent pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  justifyContent: "center",
                  marginBottom: "3rem",
                }}
              >
                {AGENT_ORDER.map((name) => {
                  const meta = AGENT_META[name];
                  return (
                    <div
                      key={name}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "100px",
                        padding: "0.35rem 0.9rem",
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span>{meta.emoji}</span>
                      {meta.title}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <IdeaInput
            value={idea}
            onChange={setIdea}
            onSubmit={handleSubmit}
            onStop={handleStop}
            running={running}
            compact={hasResults || running}
            judgeMode={judgeMode}
            onJudgeModeChange={setJudgeMode}
          />

          {/* Results grid */}
          {(hasResults || running) && (
            <div ref={resultsRef} style={{ marginTop: "2.5rem" }}>
              {startupName && (
                <div
                  style={{
                    marginBottom: "1.5rem",
                    animation: "fade-in-up 0.4s ease-out",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    {startupName}
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {memoryId && `Session ID: ${memoryId}`}
                  </p>
                </div>
              )}

              <LiveValidationDashboard
                agents={agents}
                agentOrder={AGENT_ORDER}
                running={running}
                judgeMode={judgeMode}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))",
                  gap: "1rem",
                }}
              >
                {(judgeMode ? [...AGENT_ORDER, "judge" as AgentName] : AGENT_ORDER).map((name) => {
                  const meta = AGENT_META[name];
                  const result = agents[name];
                  return (
                    <AgentCard
                      key={name}
                      agentName={name}
                      title={meta.title}
                      emoji={meta.emoji}
                      color={meta.color}
                      result={result}
                    />
                  );
                })}
              </div>

              <FounderScorecardPanel scorecard={scorecard} startupName={startupName} />

              <ToolsPanel memoryId={memoryId} startupName={startupName} />
            </div>
          )}
        </main>
      </div>

      {showSidebar && <MemorySidebar onClose={() => setShowSidebar(false)} />}
    </div>
  );
}
