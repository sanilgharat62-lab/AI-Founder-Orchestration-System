"use client";

interface IdeaInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (idea: string) => void;
  onStop: () => void;
  running: boolean;
  compact?: boolean;
  judgeMode: boolean;
  onJudgeModeChange: (v: boolean) => void;
}

const EXAMPLES = [
  "AI-powered fitness coach that adapts to your biometrics",
  "Marketplace for renting professional camera equipment",
  "SaaS tool for restaurant inventory management",
  "B2B platform connecting freelance designers with startups",
];

export default function IdeaInput({
  value,
  onChange,
  onSubmit,
  onStop,
  running,
  compact,
  judgeMode,
  onJudgeModeChange,
}: IdeaInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !running) {
      onSubmit(value);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: running ? "var(--accent-dim)" : "var(--border)",
        borderRadius: "14px",
        padding: compact ? "1rem 1.25rem" : "1.5rem",
        transition: "border-color 0.3s",
        boxShadow: running ? "0 0 0 1px var(--accent-dim)" : "none",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <div
          style={{
            fontSize: compact ? "1.2rem" : "1.5rem",
            flexShrink: 0,
            marginTop: "0.1rem",
          }}
        >
          💡
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your startup idea..."
            disabled={running}
            rows={compact ? 2 : 3}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: compact ? "0.95rem" : "1.05rem",
              lineHeight: 1.6,
              resize: "none",
              fontFamily: "inherit",
              caretColor: "var(--accent)",
            }}
          />

          {!compact && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                Try an example:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => onChange(ex)}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "0.3rem 0.65rem",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      transition: "color 0.15s, border-color 0.15s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.color = "var(--text-secondary)";
                      el.style.borderColor = "var(--border-glow)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.color = "var(--text-muted)";
                      el.style.borderColor = "var(--border)";
                    }}
                  >
                    {ex.length > 45 ? ex.slice(0, 45) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => (running ? onStop() : onSubmit(value))}
          disabled={!running && !value.trim()}
          style={{
            flexShrink: 0,
            background: running ? "transparent" : "var(--accent)",
            border: running ? "1px solid var(--border-glow)" : "none",
            borderRadius: "10px",
            color: running ? "var(--text-secondary)" : "white",
            padding: compact ? "0.5rem 1rem" : "0.65rem 1.4rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "opacity 0.2s, transform 0.1s",
            opacity: !running && !value.trim() ? 0.4 : 1,
            whiteSpace: "nowrap",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {running ? (
            <>
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid var(--border-glow)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin-slow 0.7s linear infinite",
                }}
              />
              Stop
            </>
          ) : (
            <>
              ⚡ Launch
            </>
          )}
        </button>
      </div>

      {!compact && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.85rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={() => !running && onJudgeModeChange(!judgeMode)}
            disabled={running}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: running ? "default" : "pointer",
            }}
          >
            <span
              style={{
                width: "34px",
                height: "19px",
                borderRadius: "999px",
                background: judgeMode ? "var(--accent)" : "var(--border)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: judgeMode ? "17px" : "2px",
                  width: "15px",
                  height: "15px",
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s",
                }}
              />
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              ⚖️ Judge Mode
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                — adds a 7th agent that scores & critiques the plan
              </span>
            </span>
          </button>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
            ⌘ + Enter to launch
          </p>
        </div>
      )}
    </div>
  );
}
