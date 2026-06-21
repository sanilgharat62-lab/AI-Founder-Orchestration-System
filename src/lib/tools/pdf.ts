import { MemoryStore } from "@/types";

export function generatePDFHtml(memory: MemoryStore): string {
  const agentLabels: Record<string, { title: string; emoji: string; color: string }> = {
    startup_advisor: { title: "Startup Advisor", emoji: "🎯", color: "#f97316" },
    market_research: { title: "Market Research", emoji: "📊", color: "#3b82f6" },
    product_manager: { title: "Product Manager", emoji: "📋", color: "#8b5cf6" },
    software_architect: { title: "Software Architect", emoji: "🏗️", color: "#14b8a6" },
    engineering_manager: { title: "Engineering Manager", emoji: "⚙️", color: "#f59e0b" },
    marketing_agent: { title: "Marketing Agent", emoji: "📣", color: "#ec4899" },
  };

  function mdToHtml(md: string): string {
    return md
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/```[\w]*\n([\s\S]*?)```/gm, "<pre><code>$1</code></pre>")
      .replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match.split("|").filter((c) => c.trim());
        if (cells.every((c) => /^[-\s:]+$/.test(c))) return "";
        return `<tr>${cells.map((c) => `<td>${c.trim()}</td>`).join("")}</tr>`;
      })
      .replace(/((<tr>.*<\/tr>\n?)+)/g, "<table>$1</table>")
      .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[hupct])(.*\S.*)$/gm, "<p>$1</p>");
  }

  const agentSections = Object.entries(memory.agentOutputs)
    .map(([key, output]) => {
      const meta = agentLabels[key] ?? { title: key, emoji: "🤖", color: "#666" };
      return `
        <div class="agent-section" style="border-left: 4px solid ${meta.color}">
          <div class="agent-header">
            <span class="agent-emoji">${meta.emoji}</span>
            <h2 class="agent-title">${meta.title}</h2>
          </div>
          <div class="agent-body">${mdToHtml(output)}</div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${memory.startupName} — Founder OS Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #ffffff;
    color: #1a1a2e;
    line-height: 1.6;
    font-size: 14px;
  }

  .cover {
    background: linear-gradient(135deg, #0a0a1a 0%, #1a0a3a 50%, #0a1a2a 100%);
    color: white;
    padding: 80px 60px;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    page-break-after: always;
  }

  .cover-badge {
    display: inline-block;
    background: rgba(124,106,247,0.2);
    border: 1px solid rgba(124,106,247,0.4);
    border-radius: 100px;
    padding: 6px 16px;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #a78bfa;
    margin-bottom: 24px;
  }

  .cover h1 {
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #ffffff, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .cover-idea {
    font-size: 16px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 40px;
    max-width: 500px;
  }

  .cover-meta {
    display: flex;
    gap: 32px;
  }

  .cover-meta-item label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
    margin-bottom: 4px;
  }

  .cover-meta-item span {
    font-size: 13px;
    color: rgba(255,255,255,0.7);
  }

  .content {
    max-width: 820px;
    margin: 0 auto;
    padding: 48px 60px;
  }

  .toc {
    background: #f8f7ff;
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 48px;
    page-break-after: always;
  }

  .toc h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #7c6af7;
    margin-bottom: 20px;
  }

  .toc-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #e8e4ff;
    font-size: 14px;
    color: #333;
  }

  .toc-item:last-child { border-bottom: none; }

  .toc-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .agent-section {
    margin-bottom: 48px;
    padding-left: 20px;
    page-break-inside: avoid;
  }

  .agent-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }

  .agent-emoji { font-size: 24px; }

  .agent-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    letter-spacing: -0.02em;
  }

  .agent-body h1, .agent-body h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 20px 0 8px;
  }

  .agent-body h3 {
    font-size: 14px;
    font-weight: 600;
    color: #444;
    margin: 16px 0 6px;
  }

  .agent-body p {
    color: #444;
    margin: 8px 0;
    line-height: 1.7;
  }

  .agent-body ul, .agent-body ol {
    color: #444;
    padding-left: 20px;
    margin: 8px 0;
  }

  .agent-body li { margin: 4px 0; }

  .agent-body strong { color: #1a1a2e; font-weight: 600; }

  .agent-body code {
    background: #f0eeff;
    color: #7c6af7;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  .agent-body pre {
    background: #1a1a2e;
    color: #c4b5fd;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    line-height: 1.6;
    margin: 12px 0;
  }

  .agent-body pre code {
    background: none;
    color: inherit;
    padding: 0;
  }

  .agent-body table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin: 12px 0;
  }

  .agent-body th {
    background: #f8f7ff;
    color: #7c6af7;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #e8e4ff;
  }

  .agent-body td {
    padding: 7px 12px;
    border: 1px solid #eee;
    color: #444;
  }

  .agent-body tr:nth-child(even) td { background: #fafafa; }

  .footer {
    text-align: center;
    padding: 40px;
    border-top: 1px solid #eee;
    color: #999;
    font-size: 12px;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .agent-section { page-break-inside: avoid; }
    .cover { page-break-after: always; }
    .download-banner { display: none !important; }
  }

  .download-banner {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #1a0a3a;
    color: #fff;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;
  }

  .download-banner button {
    background: #7c6af7;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .download-banner button:hover { background: #6b59e8; }
</style>
</head>
<body>

<div class="download-banner">
  <span>In the print dialog, set Destination to <strong>"Save as PDF"</strong> to download this report.</span>
  <button onclick="window.print()">Download as PDF</button>
</div>

<div class="cover">
  <div class="cover-badge">⚡ Founder OS — AI Startup Report</div>
  <h1>${memory.startupName}</h1>
  <p class="cover-idea">${memory.idea}</p>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <label>Generated</label>
      <span>${new Date(memory.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
    </div>
    <div class="cover-meta-item">
      <label>Session ID</label>
      <span>${memory.id}</span>
    </div>
    <div class="cover-meta-item">
      <label>Agents</label>
      <span>${Object.keys(memory.agentOutputs).length} / 6</span>
    </div>
  </div>
</div>

<div class="content">
  <div class="toc">
    <h2>Table of Contents</h2>
    ${Object.entries(memory.agentOutputs)
      .map(([key]) => {
        const meta = agentLabels[key] ?? { title: key, emoji: "🤖", color: "#666" };
        return `<div class="toc-item">
          <div class="toc-dot" style="background: ${meta.color}"></div>
          <span>${meta.emoji} ${meta.title}</span>
        </div>`;
      })
      .join("\n")}
  </div>

  ${agentSections}

  <div class="footer">
    Generated by Founder OS · ${new Date().toLocaleDateString()} · Session ${memory.id}
  </div>
</div>

<script>
  window.addEventListener("load", () => {
    setTimeout(() => window.print(), 400);
  });
</script>

</body>
</html>`;
}
