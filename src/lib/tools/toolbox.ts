import { MemoryStore } from "@/types";
import { SearchResult, searchWeb } from "@/lib/tools/search";

export type ToolboxAction =
  | "competitors"
  | "scrape"
  | "trends"
  | "social"
  | "reviews"
  | "domain"
  | "share";

export interface ToolLink {
  label: string;
  url: string;
}

export interface ToolboxResult {
  title: string;
  message: string;
  links?: ToolLink[];
  results?: SearchResult[];
  content?: string;
  savedSummary?: string;
}

const COMPANY_SUFFIXES = ["AI", "App", "HQ", "Labs", "Studio", "OS"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function compact(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 40);
}

function requireQuery(query?: string) {
  const cleaned = query?.trim();
  if (!cleaned) throw new Error("Enter a query first.");
  return cleaned;
}

function sectionText(memory: MemoryStore, key: keyof MemoryStore["agentOutputs"], fallback: string) {
  return (memory.agentOutputs[key] || fallback).trim();
}

function csv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

function htmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plainSnippet(value: string, fallback: string, limit = 320) {
  const cleaned = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*|__|\*|`/g, "")
    .replace(/\|/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, limit);
}

export async function runToolboxAction(action: ToolboxAction, input: { query?: string; url?: string; startupName?: string }): Promise<ToolboxResult> {
  if (action === "competitors") {
    const query = requireQuery(input.query);
    const results = await searchWeb(`${query} competitors alternatives pricing reviews`);
    return {
      title: "Competitor Research",
      message: `${results.length} competitor signals found.`,
      results,
    };
  }

  if (action === "reviews") {
    const query = requireQuery(input.query);
    const results = await searchWeb(`${query} reviews G2 Capterra Product Hunt alternatives`);
    return {
      title: "Review Mining",
      message: `${results.length} review and directory signals found.`,
      results,
    };
  }

  if (action === "scrape") {
    const url = input.url?.trim();
    if (!url) throw new Error("Enter a URL to scrape.");
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey || apiKey === "fc-your-real-key-here") {
      return {
        title: "Website Scraper",
        message: "Add FIRECRAWL_API_KEY to .env.local to scrape pages directly.",
        links: [{ label: "Open target", url }],
      };
    }

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });

    if (!res.ok) {
      throw new Error(`Firecrawl API error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const markdown = data.data?.markdown || data.markdown || "";
    return {
      title: "Website Scraper",
      message: markdown ? "Page scraped successfully." : "Scrape completed, but no markdown content was returned.",
      content: markdown.slice(0, 1200),
      links: [{ label: "Source", url }],
    };
  }

  if (action === "trends") {
    const query = requireQuery(input.query);
    const encoded = encodeURIComponent(query);
    return {
      title: "Trend Validation",
      message: "Opened demand-research shortcuts for the query.",
      links: [
        { label: "Google Trends", url: `https://trends.google.com/trends/explore?q=${encoded}` },
        { label: "Exploding Topics", url: `https://explodingtopics.com/?s=${encoded}` },
        { label: "Google Keyword Planner", url: "https://ads.google.com/home/tools/keyword-planner/" },
      ],
    };
  }

  if (action === "social") {
    const query = requireQuery(input.query);
    const encoded = encodeURIComponent(query);
    return {
      title: "Social Pain Mining",
      message: "Opened communities where customer pain and buying intent usually surface.",
      links: [
        { label: "Reddit", url: `https://www.reddit.com/search/?q=${encoded}` },
        { label: "X Search", url: `https://x.com/search?q=${encoded}&src=typed_query` },
        { label: "Hacker News", url: `https://hn.algolia.com/?q=${encoded}` },
        { label: "YouTube", url: `https://www.youtube.com/results?search_query=${encoded}` },
      ],
    };
  }

  if (action === "domain") {
    const name = input.startupName?.trim() || input.query?.trim();
    if (!name) throw new Error("Run agents first or enter a startup name.");
    const base = compact(name);
    const ideas = [base, ...COMPANY_SUFFIXES.map((suffix) => `${base}${suffix.toLowerCase()}`)];
    return {
      title: "Domain & Handle Check",
      message: "Generated domain and handle lookup shortcuts.",
      links: [
        ...ideas.slice(0, 4).map((idea) => ({ label: `${idea}.com`, url: `https://www.namecheap.com/domains/registration/results/?domain=${idea}.com` })),
        { label: "Twitter/X handle", url: `https://x.com/${base}` },
        { label: "GitHub org", url: `https://github.com/${base}` },
      ],
    };
  }

  if (action === "share") {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook || webhook === "https://hooks.slack.com/services/your/webhook") {
      return {
        title: "Slack / Email Summary",
        message: "Add SLACK_WEBHOOK_URL to .env.local to post summaries directly.",
        links: [{ label: "Open Slack app setup", url: "https://api.slack.com/messaging/webhooks" }],
      };
    }
    return {
      title: "Slack / Email Summary",
      message: "Slack webhook is configured. Use the session share action from a saved report.",
    };
  }

  throw new Error("Unknown tool action.");
}

export function generateFinancialModelCsv(memory: MemoryStore) {
  const name = memory.startupName;
  const rows = [
    ["Section", "Metric", "Month 1", "Month 2", "Month 3", "Month 6", "Month 12", "Notes"],
    ["Acquisition", "Website visitors", "1000", "2500", "5000", "15000", "50000", "Top-of-funnel traffic target"],
    ["Acquisition", "Signup conversion", "8%", "9%", "10%", "12%", "15%", "Landing page to account"],
    ["Acquisition", "New signups", "80", "225", "500", "1800", "7500", "Visitors x signup conversion"],
    ["Revenue", "Paid conversion", "2%", "3%", "4%", "6%", "8%", "Signup to paid account"],
    ["Revenue", "New paid customers", "2", "7", "20", "108", "600", "Rounded planning estimate"],
    ["Revenue", "ARPA", "$29", "$39", "$49", "$79", "$99", "Average revenue per account"],
    ["Revenue", "MRR", "$58", "$273", "$980", "$8,532", "$59,400", "New customer MRR before churn"],
    ["Unit Economics", "CAC", "$120", "$105", "$90", "$75", "$60", "Blended paid + organic CAC"],
    ["Unit Economics", "Gross margin", "75%", "78%", "80%", "82%", "85%", "Infra/support efficiency"],
    ["Unit Economics", "Payback period", "5.5 mo", "4.2 mo", "3.1 mo", "1.9 mo", "1.3 mo", "CAC / gross profit per account"],
    ["Operations", "Team cost", "$0", "$500", "$1500", "$5000", "$18000", "Founder-led to small team"],
    ["Operations", "Tooling cost", "$150", "$250", "$500", "$1500", "$4500", "Infra, APIs, analytics, support"],
    ["Cash", "Net monthly burn", "$390", "$477", "$1020", "$-2032", "$-36900", "Negative means cash generation"],
    ["Assumptions", "Startup", name, "", "", "", "", memory.idea],
  ];
  return csv(rows);
}

export function generatePitchDeckMarkdown(memory: MemoryStore) {
  const advisor = sectionText(memory, "startup_advisor", "Startup strategy output not available yet.");
  const market = sectionText(memory, "market_research", "Market research output not available yet.");
  const product = sectionText(memory, "product_manager", "Product plan output not available yet.");
  const architecture = sectionText(memory, "software_architect", "Architecture output not available yet.");
  const engineering = sectionText(memory, "engineering_manager", "Engineering plan output not available yet.");
  const goToMarket = sectionText(memory, "marketing_agent", "Marketing output not available yet.");

  return `# ${memory.startupName} Pitch Deck

## 1. One-Line Pitch
${memory.startupName} helps its target users solve this problem: ${memory.idea}

## 2. Problem
${memory.idea}

## 3. Strategic Insight
${advisor.slice(0, 1000)}

## 4. Solution
${product.slice(0, 1200)}

## 5. Market
${market.slice(0, 1200)}

## 6. Product Experience
${product.slice(0, 1200)}

## 7. Technical Moat
${architecture.slice(0, 1000)}

## 8. Go-To-Market
${goToMarket.slice(0, 1200)}

## 9. Business Model
- Primary motion: subscription-first SaaS
- Expansion: team seats, premium workflows, integrations, and usage-based automation
- Early proof targets: activation rate, paid conversion, retention, and CAC payback

## 10. Roadmap
${engineering.slice(0, 1200)}

## 11. The Ask
Fund or allocate a focused validation sprint to prove acquisition, retention, and monetization before scaling spend.

## 12. Appendix: Current Validation Checklist
- Interview 15 target users
- Test one landing page with 3 acquisition channels
- Ship one core workflow
- Measure activation within 7 days
- Convert at least 5 design partners or paid pilots
`;
}

export function generateLandingPageHtml(memory: MemoryStore) {
  const safeName = htmlEscape(memory.startupName);
  const safeIdea = htmlEscape(memory.idea);
  const market = htmlEscape(plainSnippet(sectionText(memory, "market_research", ""), "Built for customers who need a faster, clearer way to validate and launch.", 360));
  const product = htmlEscape(plainSnippet(sectionText(memory, "product_manager", ""), "A focused workflow that turns messy startup work into prioritized action.", 360));
  const moat = htmlEscape(plainSnippet(sectionText(memory, "software_architect", ""), "A practical product foundation that compounds through data, workflows, and integrations.", 300));
  const gtm = htmlEscape(plainSnippet(sectionText(memory, "marketing_agent", ""), "Start with a narrow wedge, prove repeated usage, then scale the strongest acquisition channel.", 300));
  const encodedId = htmlEscape(memory.id);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeName}</title>
  <style>
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,Arial,sans-serif;background:#07111f;color:#f8fafc}
    main{min-height:100vh;background:radial-gradient(circle at 20% 10%,#164e63 0,#07111f 38%),linear-gradient(135deg,#07111f,#111827);padding:48px 22px}
    .wrap{max-width:1120px;margin:0 auto}.hero{min-height:76vh;display:grid;align-content:center}
    .eyebrow{color:#67e8f9;font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:13px}
    h1{font-size:clamp(44px,7vw,92px);line-height:.95;margin:14px 0 22px;max-width:940px}
    p{font-size:20px;line-height:1.65;color:#cbd5e1;max-width:780px}.actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}
    button,a{display:inline-flex;align-items:center;justify-content:center;background:#22d3ee;color:#082f49;padding:14px 18px;border-radius:8px;text-decoration:none;font-weight:800;border:0;cursor:pointer;font-size:16px}
    .ghost{background:transparent;color:#e2e8f0;border:1px solid rgba(226,232,240,.28)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-top:36px}
    .card{border:1px solid rgba(148,163,184,.24);background:rgba(15,23,42,.72);border-radius:8px;padding:20px}
    h2{margin:0 0 10px;font-size:20px}.card p{font-size:15px;margin:0;color:#94a3b8}
    .section{padding:72px 0}.split{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:28px;align-items:start}
    .panel{border:1px solid rgba(103,232,249,.3);background:rgba(8,47,73,.54);border-radius:8px;padding:22px}
    label{display:block;font-size:13px;color:#bae6fd;font-weight:700;margin:12px 0 6px}input{width:100%;padding:13px 14px;border-radius:8px;border:1px solid rgba(148,163,184,.28);background:#020617;color:#f8fafc;font-size:15px}
    .wide{width:100%;margin-top:16px}.status{font-size:14px;color:#67e8f9;margin-top:12px;min-height:20px}.metric{font-size:32px;font-weight:900;color:#fff;margin-bottom:4px}
    @media(max-width:820px){.split{grid-template-columns:1fr}.hero{min-height:auto;padding-top:32px}}
  </style>
</head>
<body>
  <main>
    <section class="wrap hero">
      <div class="eyebrow">Now validating</div>
      <h1>${safeName}</h1>
      <p>${safeIdea}</p>
      <div class="actions">
        <button type="button" onclick="document.getElementById('waitlist').scrollIntoView({behavior:'smooth'})">Join the waitlist</button>
        <button class="ghost" type="button" onclick="document.getElementById('thesis').scrollIntoView({behavior:'smooth'})">See the thesis</button>
      </div>
      <div class="grid">
        <div class="card"><div class="metric">3</div><p>Validation areas: market, product, and acquisition.</p></div>
        <div class="card"><div class="metric">5</div><p>Design partners is the first proof target before scaling.</p></div>
        <div class="card"><div class="metric">30d</div><p>Run a focused validation sprint with measurable signals.</p></div>
      </div>
    </section>
    <section id="thesis" class="wrap section">
      <div class="eyebrow">Founder thesis</div>
      <h1>Why this can win</h1>
      <div class="grid">
        <div class="card"><h2>Market thesis</h2><p>${market}</p></div>
        <div class="card"><h2>Product promise</h2><p>${product}</p></div>
        <div class="card"><h2>Technical edge</h2><p>${moat}</p></div>
        <div class="card"><h2>Launch motion</h2><p>${gtm}</p></div>
      </div>
    </section>
    <section id="waitlist" class="wrap section split">
      <div>
        <div class="eyebrow">Early access</div>
        <h1>Join the validation cohort</h1>
        <p>Leave your details and this demo will save the lead into the local Founder Orchestrator database.</p>
      </div>
      <form class="panel" id="waitlistForm">
        <input type="hidden" name="memoryId" value="${encodedId}" />
        <input type="hidden" name="startupName" value="${safeName}" />
        <label for="name">Name</label>
        <input id="name" name="name" placeholder="Your name" />
        <label for="email">Email</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" required />
        <label for="role">Role</label>
        <input id="role" name="role" placeholder="Founder, coach, operator..." />
        <button class="wide" type="submit">Request early access</button>
        <div class="status" id="status"></div>
      </form>
    </section>
  </main>
  <script>
    const form = document.getElementById('waitlistForm');
    const status = document.getElementById('status');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = 'Saving...';
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not save lead');
        status.textContent = 'Saved. You are on the waitlist.';
        form.reset();
      } catch (error) {
        status.textContent = error.message || 'Could not save lead.';
      }
    });
  </script>
</body>
</html>`;
}

export function generateScorecardMarkdown(memory: MemoryStore) {
  const sc = memory.scorecard;
  if (!sc) {
    return `# ${memory.startupName} — Founder Scorecard\n\nJudge Mode was not run for this session. Re-run with Judge Mode enabled to generate a scorecard.`;
  }

  const dimensionRows = sc.dimensions
    .map((d) => `| ${d.label} | ${d.score}/10 | ${d.rationale} |`)
    .join("\n");

  const critiqueBlocks = sc.critiques
    .map(
      (c) => `### ${c.agent.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} — Confidence ${c.confidence}/100
**Strengths**
${c.strengths.map((s) => `- ${s}`).join("\n") || "- None noted"}

**Weaknesses**
${c.weaknesses.map((w) => `- ${w}`).join("\n") || "- None noted"}`
    )
    .join("\n\n");

  return `# ${memory.startupName} — Founder Scorecard

**Overall Score:** ${sc.overallScore}/100
**Verdict:** ${sc.verdict}

## Dimension Scores
| Dimension | Score | Rationale |
|-----------|-------|-----------|
${dimensionRows}

## Top Risks
${sc.topRisks.map((r) => `- ${r}`).join("\n")}

## Top Actions
${sc.topActions.map((a) => `- ${a}`).join("\n")}

## Per-Agent Critique
${critiqueBlocks}
`;
}

export function generateLeadsCsv(memory: MemoryStore) {
  const name = memory.startupName.replace(/"/g, '""');
  const idea = memory.idea.replace(/"/g, '""');
  const rows = [
    ["Segment", "Buyer", "Company Type", "Pain Signal", "Lead Source", "Outreach Angle", "Qualification Question", "Priority"],
    ["Early adopters", "Founder / operator", "Seed-stage startup", "Manual workaround or spreadsheet-heavy process", "LinkedIn, founder communities, accelerators", `${name} can remove one repeated weekly workflow around: ${idea}`, "What workflow do you repeat every week that still feels too manual?", "High"],
    ["Teams", "Department lead", "Growing SaaS team", "Tool fragmentation and reporting gaps", "G2 categories, job posts, Slack communities", `${name} creates one place to coordinate the workflow.`, "How do you currently track handoffs and decisions?", "High"],
    ["Agencies", "Owner / strategist", "Boutique agency", "Client delivery needs repeatable templates", "Clutch, Upwork, Product Hunt launches", `${name} can standardize delivery and reporting.`, "Which client deliverable takes the most repeated setup time?", "Medium"],
    ["Consultants", "Independent consultant", "Fractional operator", "Needs repeatable client operating system", "Newsletter sponsors, LinkedIn search", `${name} gives consultants a reusable execution layer.`, "What parts of client onboarding do you rebuild from scratch?", "Medium"],
    ["Enterprise pilots", "Innovation lead", "Enterprise business unit", "Slow validation cycles and scattered research", "Conference lists, podcasts, analyst reports", `${name} can compress early validation into a measurable sprint.`, "Where does validation currently stall inside the org?", "Low"],
  ];
  return csv(rows);
}

export function generateTasksCsv(memory: MemoryStore) {
  const engineering = memory.agentOutputs.engineering_manager || memory.agentOutputs.software_architect || "";
  const source = engineering
    .split("\n")
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter((line) => line.length > 20)
    .slice(0, 12);
  const tasks = source.length ? source : [
    "Define MVP scope and success metrics",
    "Build onboarding and core workflow",
    "Instrument activation, retention, and conversion analytics",
    "Prepare beta launch checklist",
  ];
  const rows = [
    ["Title", "Status", "Priority", "Sprint", "Owner", "Acceptance Criteria", "Source"],
    ...tasks.map((task, index) => [
      task.slice(0, 120),
      "Todo",
      index < 3 ? "High" : "Medium",
      index < 4 ? "MVP Sprint" : index < 8 ? "Beta Sprint" : "Launch Sprint",
      index % 3 === 0 ? "Product" : index % 3 === 1 ? "Engineering" : "Growth",
      "Clear owner, measurable result, and demo-ready output",
      memory.startupName,
    ]),
  ];
  return csv(rows);
}
