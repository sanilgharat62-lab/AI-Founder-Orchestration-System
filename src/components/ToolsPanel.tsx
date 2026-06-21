"use client";

import { useCallback, useEffect, useState } from "react";

interface ToolsPanelProps {
  memoryId: string | null;
  startupName: string | null;
}

type ToolStatus = "idle" | "loading" | "success" | "error";

interface ToolState {
  status: ToolStatus;
  message?: string;
  link?: string;
}

interface ToolLink {
  label: string;
  url: string;
}

interface SearchLikeResult {
  title: string;
  url: string;
  snippet: string;
}

interface ToolRunRecord {
  id: string;
  action: string;
  title: string;
  summary: string;
  createdAt: string;
}

export default function ToolsPanel({ memoryId, startupName }: ToolsPanelProps) {
  const [github, setGithub] = useState<ToolState>({ status: "idle" });
  const [notion, setNotion] = useState<ToolState>({ status: "idle" });
  const [search, setSearch] = useState<ToolState>({ status: "idle" });
  const [toolbox, setToolbox] = useState<Record<string, ToolState>>({});
  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [competitorQuery, setCompetitorQuery] = useState("");
  const [trendsQuery, setTrendsQuery] = useState("");
  const [socialQuery, setSocialQuery] = useState("");
  const [reviewsQuery, setReviewsQuery] = useState("");
  const [domainQuery, setDomainQuery] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [searchResults, setSearchResults] = useState<SearchLikeResult[]>([]);
  const [toolLinks, setToolLinks] = useState<Record<string, ToolLink[]>>({});
  const [toolContent, setToolContent] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<ToolRunRecord[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const disabled = !memoryId;

  const refreshHistory = useCallback(async () => {
    const suffix = memoryId ? `?memoryId=${memoryId}` : "";
    try {
      const res = await fetch(`/api/tool-history${suffix}`);
      const data = await res.json();
      setHistory(data.records ?? []);
    } catch {
      setHistory([]);
    }
  }, [memoryId]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  async function handleExportPDF() {
    if (!memoryId) return;
    window.open(`/api/export?id=${memoryId}`, "_blank");
  }

  async function handleGitHub() {
    if (!memoryId || !ghOwner || !ghRepo) return;
    setGithub({ status: "loading" });
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId, owner: ghOwner, repo: ghRepo }),
      });
      const data = await res.json();
      if (data.error) {
        setGithub({ status: "error", message: data.error });
      } else {
        const firstUrl = data.issues?.find((i: { issueUrl?: string }) => i.issueUrl)?.issueUrl;
        setGithub({
          status: "success",
          message: `${data.created} issue${data.created !== 1 ? "s" : ""} created${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
          link: firstUrl ? `https://github.com/${ghOwner}/${ghRepo}/issues` : undefined,
        });
      }
    } catch (e) {
      setGithub({ status: "error", message: String(e) });
    }
  }

  async function handleNotion() {
    if (!memoryId) return;
    setNotion({ status: "loading" });
    try {
      const res = await fetch("/api/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId }),
      });
      const data = await res.json();
      if (data.errors?.length && data.published === 0) {
        setNotion({ status: "error", message: data.errors[0] });
      } else {
        const firstUrl = data.pages?.[0]?.pageUrl;
        setNotion({
          status: "success",
          message: `${data.published} page${data.published !== 1 ? "s" : ""} published to Notion`,
          link: firstUrl,
        });
      }
    } catch (e) {
      setNotion({ status: "error", message: String(e) });
    }
  }

  async function handleSearch() {
    if (!webSearchQuery.trim()) return;
    setSearch({ status: "loading" });
    setSearchResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: webSearchQuery }),
      });
      const data = await res.json();
      if (data.error) {
        setSearch({ status: "error", message: data.error });
      } else if (data.results?.length) {
        setSearchResults(data.results);
        setSearch({ status: "success", message: `${data.results.length} results` });
      } else {
        setSearch({ status: "error", message: "No results found" });
      }
    } catch (e) {
      setSearch({ status: "error", message: String(e) });
    }
  }

  async function handleToolbox(action: string, payload: Record<string, string>) {
    setToolbox((prev) => ({ ...prev, [action]: { status: "loading" } }));
    setToolLinks((prev) => ({ ...prev, [action]: [] }));
    setToolContent((prev) => ({ ...prev, [action]: "" }));
    if (["competitors", "reviews"].includes(action)) setSearchResults([]);

    try {
      const res = await fetch("/api/toolbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, memoryId: memoryId ?? undefined, startupName: startupName ?? "", ...payload }),
      });
      const data = await res.json();
      if (data.error) {
        setToolbox((prev) => ({ ...prev, [action]: { status: "error", message: data.error } }));
        return;
      }
      if (data.results?.length) setSearchResults(data.results);
      if (data.links?.length) setToolLinks((prev) => ({ ...prev, [action]: data.links }));
      if (data.content) setToolContent((prev) => ({ ...prev, [action]: data.content }));
      setToolbox((prev) => ({ ...prev, [action]: { status: "success", message: data.message ?? "Done" } }));
      refreshHistory();
    } catch (e) {
      setToolbox((prev) => ({ ...prev, [action]: { status: "error", message: String(e) } }));
    }
  }

  function handleArtifact(path: string) {
    if (!memoryId) return;
    window.open(`${path}?id=${memoryId}`, "_blank");
    setTimeout(refreshHistory, 800);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(ev.target?.result as string);
    reader.readAsText(file);
  }

  const tools = [
    {
      id: "launch-kit",
      emoji: "🚀",
      title: "One-Click Launch Kit",
      description: "Everything bundled into one .zip",
      color: "#facc15",
      content: (
        <ArtifactTool
          disabled={disabled}
          color="#facc15"
          button="Download Launch Kit"
          details={["Pitch deck, financials, leads", "Tasks, landing page, full report", "Scorecard, raw agent outputs"]}
          onClick={() => handleArtifact("/api/launch-kit")}
        />
      ),
    },
    {
      id: "pdf",
      emoji: "📄",
      title: "Export PDF",
      description: "Download full startup report",
      color: "#7c6af7",
      content: (
        <button
          onClick={handleExportPDF}
          disabled={disabled}
          style={btnStyle("#7c6af7", disabled)}
        >
          {disabled ? "Run agents first" : `Download ${startupName ?? ""} Report`} →
        </button>
      ),
    },
    {
      id: "github",
      emoji: "🐙",
      title: "GitHub Issues",
      description: "Create issues from engineering plan",
      color: "#4ade80",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            placeholder="owner (e.g. yourname)"
            value={ghOwner}
            onChange={(e) => setGhOwner(e.target.value)}
            style={inputStyle}
            disabled={disabled}
          />
          <input
            placeholder="repo (e.g. my-startup)"
            value={ghRepo}
            onChange={(e) => setGhRepo(e.target.value)}
            style={inputStyle}
            disabled={disabled}
          />
          <button
            onClick={handleGitHub}
            disabled={disabled || !ghOwner || !ghRepo || github.status === "loading"}
            style={btnStyle("#4ade80", disabled || !ghOwner || !ghRepo)}
          >
            {github.status === "loading" ? "Creating…" : "Create Issues"}
          </button>
          <ToolFeedback state={github} />
        </div>
      ),
    },
    {
      id: "notion",
      emoji: "📝",
      title: "Notion Docs",
      description: "Publish all outputs to Notion",
      color: "#f59e0b",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
            Publishes all 6 agent outputs as Notion pages. Requires NOTION_API_KEY + NOTION_DATABASE_ID in .env.local
          </p>
          <button
            onClick={handleNotion}
            disabled={disabled || notion.status === "loading"}
            style={btnStyle("#f59e0b", disabled)}
          >
            {notion.status === "loading" ? "Publishing…" : "Publish to Notion"}
          </button>
          <ToolFeedback state={notion} />
        </div>
      ),
    },
    {
      id: "search",
      emoji: "🔍",
      title: "Web Search",
      description: "Research markets & competitors",
      color: "#60a5fa",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <input
              placeholder="e.g. AI fitness app competitors 2024"
              value={webSearchQuery}
              onChange={(e) => setWebSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleSearch}
              disabled={!webSearchQuery.trim() || search.status === "loading"}
              style={btnStyle("#60a5fa", !webSearchQuery.trim())}
            >
              {search.status === "loading" ? "…" : "Go"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.25rem" }}>
              {searchResults.map((r, i) => (
                <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.5rem 0.65rem" }}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.75rem", fontWeight: 600, color: "#60a5fa", textDecoration: "none", display: "block", marginBottom: "0.2rem" }}
                  >
                    {r.title || r.url}
                  </a>
                  {r.snippet && (
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                      {r.snippet.slice(0, 120)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "competitors",
      emoji: "🏁",
      title: "Competitor Research",
      description: "Find alternatives, pricing & positioning",
      color: "#38bdf8",
      content: (
        <ToolboxSearch
          query={competitorQuery}
          setQuery={setCompetitorQuery}
          placeholder="competitors for your idea"
          button="Research"
          state={toolbox.competitors}
          onRun={() => handleToolbox("competitors", { query: competitorQuery })}
        />
      ),
    },
    {
      id: "scrape",
      emoji: "🧲",
      title: "Website Scraper",
      description: "Scrape competitor pages with Firecrawl",
      color: "#22c55e",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            placeholder="https://competitor.com/pricing"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={() => handleToolbox("scrape", { url: scrapeUrl })}
            disabled={!scrapeUrl.trim() || toolbox.scrape?.status === "loading"}
            style={btnStyle("#22c55e", !scrapeUrl.trim())}
          >
            {toolbox.scrape?.status === "loading" ? "Scraping…" : "Scrape Page"}
          </button>
          <ToolFeedback state={toolbox.scrape ?? { status: "idle" }} />
          <ToolLinks links={toolLinks.scrape} />
          <ContentPreview content={toolContent.scrape} />
        </div>
      ),
    },
    {
      id: "trends",
      emoji: "📈",
      title: "Google Trends",
      description: "Validate demand & search interest",
      color: "#a78bfa",
      content: (
        <ToolboxSearch
          query={trendsQuery}
          setQuery={setTrendsQuery}
          placeholder="trend keyword"
          button="Open Trends"
          state={toolbox.trends}
          links={toolLinks.trends}
          onRun={() => handleToolbox("trends", { query: trendsQuery })}
        />
      ),
    },
    {
      id: "social",
      emoji: "💬",
      title: "Reddit / X Pain Mining",
      description: "Find complaints & buying signals",
      color: "#fb7185",
      content: (
        <ToolboxSearch
          query={socialQuery}
          setQuery={setSocialQuery}
          placeholder="customer pain keywords"
          button="Find Pain"
          state={toolbox.social}
          links={toolLinks.social}
          onRun={() => handleToolbox("social", { query: socialQuery })}
        />
      ),
    },
    {
      id: "reviews",
      emoji: "⭐",
      title: "G2 / Product Hunt",
      description: "Mine reviews and directories",
      color: "#facc15",
      content: (
        <ToolboxSearch
          query={reviewsQuery}
          setQuery={setReviewsQuery}
          placeholder="product category"
          button="Mine Reviews"
          state={toolbox.reviews}
          onRun={() => handleToolbox("reviews", { query: reviewsQuery })}
        />
      ),
    },
    {
      id: "finance",
      emoji: "💸",
      title: "Financial Model",
      description: "Revenue, CAC, payback & burn",
      color: "#34d399",
      content: (
        <ArtifactTool
          disabled={disabled}
          color="#34d399"
          button="Download Model"
          details={["12-month growth model", "CAC, margin, payback", "Burn and cash notes"]}
          onClick={() => handleArtifact("/api/financial-model")}
        />
      ),
    },
    {
      id: "deck",
      emoji: "🎞️",
      title: "Pitch Deck",
      description: "Investor narrative & ask",
      color: "#c084fc",
      content: (
        <ArtifactTool
          disabled={disabled}
          color="#c084fc"
          button="Download Deck"
          details={["12-slide structure", "Market, product, moat", "GTM, roadmap, ask"]}
          onClick={() => handleArtifact("/api/pitch-deck")}
        />
      ),
    },
    {
      id: "landing",
      emoji: "🌐",
      title: "Landing Page",
      description: "Polished waitlist page",
      color: "#2dd4bf",
      content: (
        <ArtifactTool
          disabled={disabled}
          color="#2dd4bf"
          button="Preview Page"
          details={["Hero and CTA", "Market thesis cards", "Product promise section"]}
          onClick={() => handleArtifact("/api/landing-page")}
        />
      ),
    },
    {
      id: "domain",
      emoji: "🔗",
      title: "Domain & Handles",
      description: "Check domain and social names",
      color: "#818cf8",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            placeholder={startupName ? startupName : "startup name"}
            value={domainQuery}
            onChange={(e) => setDomainQuery(e.target.value)}
            style={inputStyle}
          />
          <button
            onClick={() => handleToolbox("domain", { query: domainQuery || startupName || "" })}
            disabled={!startupName && !domainQuery.trim()}
            style={btnStyle("#818cf8", !startupName && !domainQuery.trim())}
          >
            Check Names
          </button>
          <ToolFeedback state={toolbox.domain ?? { status: "idle" }} />
          <ToolLinks links={toolLinks.domain} />
        </div>
      ),
    },
    {
      id: "leads",
      emoji: "🧾",
      title: "CRM Leads",
      description: "ICP segments & outreach",
      color: "#f472b6",
      content: (
        <ArtifactTool
          disabled={disabled}
          color="#f472b6"
          button="Download Leads"
          details={["Buyer personas", "Lead sources", "Qualification questions"]}
          onClick={() => handleArtifact("/api/leads")}
        />
      ),
    },
    {
      id: "tasks",
      emoji: "✅",
      title: "Linear / Jira / Trello",
      description: "Import-ready task plan",
      color: "#94a3b8",
      content: (
        <ArtifactTool
          disabled={disabled}
          color="#94a3b8"
          button="Download Tasks"
          details={["Sprint grouping", "Owners and priority", "Acceptance criteria"]}
          onClick={() => handleArtifact("/api/tasks")}
        />
      ),
    },
    {
      id: "share",
      emoji: "📣",
      title: "Slack / Email",
      description: "Share report summary",
      color: "#fb923c",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button onClick={() => handleToolbox("share", {})} style={btnStyle("#fb923c", false)}>
            Check Sharing Setup
          </button>
          <ToolFeedback state={toolbox.share ?? { status: "idle" }} />
          <ToolLinks links={toolLinks.share} />
        </div>
      ),
    },
    {
      id: "file",
      emoji: "📎",
      title: "Upload File",
      description: "Business plans, PRDs, competitor reports",
      color: "#ec4899",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label
            style={{
              display: "block",
              background: "var(--bg)",
              border: "1px dashed var(--border-glow)",
              borderRadius: "8px",
              padding: "1rem",
              textAlign: "center",
              cursor: "pointer",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              transition: "border-color 0.2s",
            }}
          >
            {fileName ? `✓ ${fileName}` : "Click to upload .txt, .pdf, .md, .docx"}
            <input
              type="file"
              accept=".txt,.md,.pdf,.docx,.csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          {fileContent && (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.6rem", maxHeight: "100px", overflowY: "auto" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, whiteSpace: "pre-wrap" }}>
                {fileContent.slice(0, 400)}{fileContent.length > 400 ? "…" : ""}
              </p>
            </div>
          )}
          {fileName && (
            <p style={{ fontSize: "0.72rem", color: "var(--success)", margin: 0 }}>
              ✓ File loaded — agents will use this as context on next run
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        overflow: "hidden",
        marginTop: "1.5rem",
      }}
    >
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <span style={{ fontSize: "1rem" }}>🛠️</span>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>Tools</span>
        {disabled && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "auto" }}>
            Run agents first to unlock
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1px",
          background: "var(--border)",
        }}
      >
        {tools.map((tool) => (
          <div
            key={tool.id}
            style={{
              background: "var(--bg-card)",
              padding: "1rem 1.1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  background: `${tool.color}15`,
                  border: `1px solid ${tool.color}30`,
                  borderRadius: "7px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {tool.emoji}
              </span>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {tool.title}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                  {tool.description}
                </div>
              </div>
            </div>
            {tool.content}
          </div>
        ))}
      </div>
      {history.length > 0 && (
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>Saved tool database</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{history.length} recent records</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.55rem" }}>
            {history.slice(0, 6).map((item) => (
              <div key={item.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.65rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <strong style={{ fontSize: "0.74rem", color: "var(--text-primary)" }}>{item.title}</strong>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.45 }}>
                  {item.summary.slice(0, 120)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArtifactTool({
  disabled,
  color,
  button,
  details,
  onClick,
}: {
  disabled: boolean;
  color: string;
  button: string;
  details: string[];
  onClick: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <div style={{ display: "grid", gap: "0.28rem" }}>
        {details.map((detail) => (
          <span key={detail} style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.25 }}>
            • {detail}
          </span>
        ))}
      </div>
      <button onClick={onClick} disabled={disabled} style={btnStyle(color, disabled)}>
        {disabled ? "Run agents first" : button}
      </button>
    </div>
  );
}

function ToolboxSearch({
  query,
  setQuery,
  placeholder,
  button,
  state,
  links,
  onRun,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  button: string;
  state?: ToolState;
  links?: ToolLink[];
  onRun: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onRun()}
        style={inputStyle}
      />
      <button
        onClick={onRun}
        disabled={!query.trim() || state?.status === "loading"}
        style={btnStyle("#60a5fa", !query.trim())}
      >
        {state?.status === "loading" ? "Working…" : button}
      </button>
      <ToolFeedback state={state ?? { status: "idle" }} />
      <ToolLinks links={links} />
    </div>
  );
}

function ToolLinks({ links }: { links?: ToolLink[] }) {
  if (!links?.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
      {links.map((link) => (
        <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "var(--text-primary)", textDecoration: "none", border: "1px solid var(--border)", borderRadius: "999px", padding: "0.2rem 0.45rem" }}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

function ContentPreview({ content }: { content?: string }) {
  if (!content) return null;
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.6rem", maxHeight: "120px", overflowY: "auto" }}>
      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
        {content}
      </p>
    </div>
  );
}

function ToolFeedback({ state }: { state: ToolState }) {
  if (state.status === "idle") return null;
  if (state.status === "loading") return (
    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Processing…</p>
  );
  if (state.status === "error") return (
    <p style={{ fontSize: "0.72rem", color: "var(--error)", margin: 0 }}>✗ {state.message}</p>
  );
  return (
    <p style={{ fontSize: "0.72rem", color: "var(--success)", margin: 0 }}>
      ✓ {state.message}
      {state.link && (
        <> · <a href={state.link} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>View →</a></>
      )}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "0.4rem 0.65rem",
  fontSize: "0.75rem",
  color: "var(--text-primary)",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
};

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? "var(--bg)" : `${color}18`,
    border: `1px solid ${disabled ? "var(--border)" : color + "40"}`,
    borderRadius: "6px",
    color: disabled ? "var(--text-muted)" : color,
    padding: "0.45rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    width: "100%",
    transition: "background 0.15s",
    fontFamily: "inherit",
  };
}
