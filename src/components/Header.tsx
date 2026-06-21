"use client";

interface HeaderProps {
  onHistoryClick: () => void;
  startupName: string | null;
  memoryId: string | null;
}

export default function Header({ onHistoryClick, startupName, memoryId }: HeaderProps) {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "rgba(10, 10, 15, 0.9)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            background: "var(--accent)",
            borderRadius: "7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
          }}
        >
          ⚡
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          Founder OS
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {startupName && (
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0.25rem 0.65rem",
            }}
          >
            {startupName}
          </span>
        )}
        <button
          onClick={onHistoryClick}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            padding: "0.35rem 0.85rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.borderColor = "var(--border-glow)";
            (e.target as HTMLElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.borderColor = "var(--border)";
            (e.target as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          📂 History
        </button>
      </div>
    </header>
  );
}
