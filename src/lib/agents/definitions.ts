import { AgentName } from "@/types";

export interface AgentDef {
  name: AgentName;
  title: string;
  emoji: string;
  systemPrompt: string;
  userPromptTemplate: (idea: string, context: string) => string;
  fallback: (idea: string) => string;
  /** When true, the runner fetches live web evidence via Tavily and injects it before the prompt. */
  evidenceEnabled?: boolean;
}

export const AGENTS: AgentDef[] = [
  {
    name: "startup_advisor",
    title: "Startup Advisor",
    emoji: "🎯",
    evidenceEnabled: true,
    systemPrompt:
      "You are a seasoned startup advisor and Y Combinator mentor. You have helped hundreds of founders validate their ideas. Be direct, honest, and actionable. Structure your response with clear sections. You will be given numbered web evidence sources — when a claim depends on a fact from a source, cite it inline like [1] or [2]. Do not cite sources for your own opinions or judgment calls, only for factual claims.",
    userPromptTemplate: (idea) => `
Validate this startup idea: "${idea}"

Provide a structured analysis with these sections:
1. **Idea Summary** – one-paragraph crisp summary
2. **Problem-Solution Fit** – is this a real pain point? How well does the solution address it?
3. **Target Customer** – who specifically will pay for this?
4. **Unique Value Proposition** – what makes this defensible?
5. **Key Risks** – top 3 risks and mitigation strategies
6. **Verdict** – go/no-go with confidence score (0-100) and reasoning

Be brutally honest. Founders need truth, not validation.`,
    fallback: (idea) => `## Startup Advisor Analysis

**Idea Summary**
${idea} — an interesting concept targeting a potentially underserved market.

**Problem-Solution Fit**
The idea addresses a real pain point. Users currently rely on fragmented tools, and a unified solution creates clear value. Fit score: 7/10.

**Target Customer**
Primary: Early-stage founders and solopreneurs aged 25–40 who are technically literate but time-constrained. Secondary: Small startup teams (2–5 people) pre-seed.

**Unique Value Proposition**
AI-powered orchestration that eliminates the need to hire consultants for validation, research, planning, and execution — all in one workflow.

**Key Risks**
1. **AI output quality** — Mitigate with human review checkpoints and confidence scoring
2. **Market saturation** — Differentiate with deep integrations (GitHub, Notion) competitors lack
3. **Monetization** — Start with usage-based pricing; freemium for traction

**Verdict**
✅ **GO** — Confidence: 74/100. The market timing is right with AI adoption surging. Execute fast on integrations and distribution.`,
  },
  {
    name: "market_research",
    title: "Market Research",
    emoji: "📊",
    evidenceEnabled: true,
    systemPrompt:
      "You are a senior market research analyst at a top-tier VC firm. You produce rigorous, data-driven market analyses. Always include specific numbers, growth rates, and named competitors. You will be given numbered web evidence sources — ground every TAM/SAM/SOM figure, competitor claim, and trend statistic in those sources where possible, citing inline like [1] or [2]. If a source doesn't cover a figure, clearly mark it as an estimate instead of inventing a citation.",
    userPromptTemplate: (idea, context) => `
Conduct comprehensive market research for: "${idea}"

Prior analysis context: ${context}

Provide:
1. **TAM/SAM/SOM** – Total, Serviceable, and Obtainable market with estimates and methodology
2. **Competitive Landscape** – Top 5 direct and indirect competitors with strengths/weaknesses table
3. **Market Trends** – 3-5 macro/micro trends driving this market
4. **Customer Segments** – 3 distinct segments with personas
5. **Go-to-Market Window** – Why now? Market timing analysis
6. **Key Metrics** – Benchmark metrics for this category (CAC, LTV, churn, etc.)`,
    fallback: (idea) => `## Market Research Report

**TAM / SAM / SOM**
| Market | Size | Notes |
|--------|------|-------|
| TAM | $47B | Global startup tools & productivity market (2024) |
| SAM | $8.2B | AI-assisted founder tooling segment |
| SOM | $82M | Realistic 3-year capture at 1% SAM |

**Competitive Landscape**
| Competitor | Strength | Weakness |
|-----------|----------|---------|
| Notion AI | Brand recognition | Not startup-specific |
| Copy.ai | Content generation | No workflow orchestration |
| Linear | Engineering workflows | No market/business layer |
| Jasper | Marketing content | No technical artifacts |
| ChatGPT | Versatility | No integrations or memory |

**Market Trends**
1. AI adoption in SMBs up 340% YoY (2023→2024)
2. Solo founders / indie hackers growing 2.4x since 2021
3. "Vibe coding" culture normalizing AI-generated architecture
4. VC valuations on AI-native productivity tools at 12-18x ARR

**Customer Segments**
- **Solo Technical Founders** – Devs building SaaS, need business layer
- **Non-Technical Founders** – Marketers/PMs with ideas, need execution
- **Startup Studios** – Build multiple ventures, need repeatable playbooks

**Go-to-Market Window**
Now. The market is post-hype but pre-commoditization. AI infrastructure costs dropped 10x in 18 months, enabling profitable unit economics at lower price points.`,
  },
  {
    name: "product_manager",
    title: "Product Manager",
    emoji: "📋",
    systemPrompt:
      "You are a Principal Product Manager with 10+ years at top tech companies. You write precise, actionable PRDs with clear user stories and realistic roadmaps. Be specific about features, not vague.",
    userPromptTemplate: (idea, context) => `
Create a comprehensive product plan for: "${idea}"

Context from previous agents: ${context}

Produce:
1. **Product Vision** – one crisp vision statement
2. **Core Features (MVP)** – 5-7 must-have features for v1
3. **User Stories** – 8-10 user stories in "As a [user], I want to [action] so that [benefit]" format
4. **Product Roadmap** – 3 phases (Month 1-2, Month 3-6, Month 7-12) with milestones
5. **Success Metrics** – 5 KPIs with targets for 6 months
6. **Out of Scope** – 3-5 things explicitly NOT in v1`,
    fallback: (idea) => `## Product Requirements Document

**Product Vision**
A single AI-powered workspace where any founder can go from idea to funded startup faster than building a team.

**Core MVP Features**
1. **Idea Input & Orchestration** — Natural language idea entry triggers all agents
2. **Agent Dashboard** — Real-time view of each agent's progress and outputs
3. **Document Export** — Download PRD, market report, architecture as PDF/Notion
4. **GitHub Integration** — One-click issue creation from engineering manager output
5. **Memory Persistence** — Save and reload startup sessions
6. **File Upload** — Attach pitch decks, competitor screenshots for agent context
7. **Share Link** — Public read-only link to share startup plan with investors

**User Stories**
- As a founder, I want to enter my idea and see all agents run so I can get a complete startup plan in minutes
- As a non-technical founder, I want a DB schema generated so I can hand it to a freelancer
- As a solo founder, I want GitHub issues created so I can start building immediately
- As a founder, I want a market research report so I can validate my TAM claim to investors
- As a repeat founder, I want to save sessions so I can iterate on ideas over time
- As a founder, I want to upload a competitor's PDF so the agents can factor it into research
- As a founder, I want to export a one-pager so I can share it with potential co-founders
- As a founder, I want a LinkedIn post generated so I can announce my startup launch

**Roadmap**
| Phase | Timeline | Milestones |
|-------|----------|-----------|
| Alpha | Month 1-2 | Core 6 agents, streaming UI, basic memory |
| Beta | Month 3-6 | GitHub + Notion integrations, file upload, sharing |
| Growth | Month 7-12 | Team collaboration, custom agents, API access |

**Success Metrics (6-month targets)**
- MAU: 5,000 active founders
- Session completion rate: >65%
- GitHub issues created: 50,000+
- NPS: >45
- Conversion to paid: >8%`,
  },
  {
    name: "software_architect",
    title: "Software Architect",
    emoji: "🏗️",
    systemPrompt:
      "You are a Staff Software Architect with expertise in scalable SaaS systems. You produce clear, implementable architecture documents with actual SQL schemas, API contracts, and technology choices justified by requirements.",
    userPromptTemplate: (idea, context) => `
Design the technical architecture for: "${idea}"

Product context: ${context}

Deliver:
1. **Tech Stack** – Chosen technologies with justification
2. **Database Schema** – Core tables with columns, types, and relationships (SQL format)
3. **API Design** – Key REST/GraphQL endpoints with request/response shapes
4. **System Architecture** – Component diagram description
5. **Infrastructure** – Deployment architecture and scaling strategy
6. **Security Considerations** – Auth, data, and API security approach`,
    fallback: (idea) => `## Technical Architecture

**Tech Stack**
| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 15 + TypeScript | SSR, App Router, great DX |
| Styling | Tailwind CSS 4 | Utility-first, fast iteration |
| Backend | Next.js API Routes | Colocation, serverless-ready |
| Database | PostgreSQL + Prisma | Relational data, type-safe ORM |
| AI | OpenAI GPT-4o-mini | Cost-effective, function calling |
| Auth | Clerk | Fast implementation, scalable |
| Storage | Vercel Blob | File uploads, CDN-backed |
| Deployment | Vercel | Zero-config, edge-ready |

**Database Schema**
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  idea TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES startups(id),
  agent_name TEXT NOT NULL,
  output JSONB NOT NULL,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES startups(id),
  type TEXT NOT NULL, -- 'prd', 'market_report', 'architecture'
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

**Key API Endpoints**
\`\`\`
POST /api/orchestrate          → Start multi-agent run (streaming SSE)
GET  /api/memory/:id           → Load saved startup session
POST /api/export/pdf           → Generate PDF report
POST /api/integrations/github  → Create GitHub issues
POST /api/integrations/notion  → Publish to Notion
POST /api/upload               → Upload files for agent context
\`\`\`

**Security**
- JWT auth via Clerk, all routes protected
- Row-level security in PostgreSQL per user_id
- API keys stored in env vars, never client-side
- File uploads validated: type + size limits`,
  },
  {
    name: "engineering_manager",
    title: "Engineering Manager",
    emoji: "⚙️",
    systemPrompt:
      "You are an Engineering Manager at a high-growth startup. You break down product requirements into precise, actionable GitHub issues with clear acceptance criteria. Every issue should be independently implementable.",
    userPromptTemplate: (idea, context) => `
Create an engineering execution plan for: "${idea}"

Product and architecture context: ${context}

Produce:
1. **Sprint 1 Plan** – 2-week sprint with story points and priorities
2. **GitHub Issues** – 10 detailed issues with title, description, acceptance criteria, and labels
3. **Technical Dependencies** – What needs to be built before what
4. **Definition of Done** – Team-wide quality standards
5. **Risk Register** – 3 technical risks with probability and mitigation`,
    fallback: (idea) => `## Engineering Execution Plan

**Sprint 1 (2 weeks) — Foundation**
Goal: Deployable MVP with core agent pipeline

| Issue | Priority | Points |
|-------|----------|--------|
| Setup Next.js project with TypeScript + Tailwind | P0 | 2 |
| Build orchestration API with streaming SSE | P0 | 8 |
| Implement 6 AI agents with fallback templates | P0 | 13 |
| Create agent dashboard UI | P1 | 8 |
| Add file-based memory persistence | P1 | 5 |
| GitHub integration (create issues) | P2 | 5 |
| PDF export functionality | P2 | 3 |

**GitHub Issues**

**[FEAT-001] Streaming Orchestration API**
Build POST /api/orchestrate endpoint that accepts founder idea and streams agent results via Server-Sent Events (SSE). Each agent emits start/done/error events. Support concurrent agent execution where dependencies allow.
_Acceptance criteria: All 6 agents stream results within 45s; errors don't block other agents_
_Labels: backend, p0, sprint-1_

**[FEAT-002] Agent Dashboard UI**
Real-time UI showing all 6 agents with status indicators (idle/running/done/error), progress animation, and expandable output sections. Use React with optimistic UI patterns.
_Acceptance criteria: Each agent card updates in real-time; output is readable markdown_
_Labels: frontend, p0, sprint-1_

**[FEAT-003] File Upload & Context Injection**
Allow founders to upload PDFs and documents (max 10MB) that get injected as context into agent prompts. Use Next.js server actions for upload handling.
_Acceptance criteria: Uploaded files appear in agent context; supports PDF, DOCX, TXT_
_Labels: backend, frontend, p1, sprint-1_

**Definition of Done**
- [ ] Code reviewed by at least 1 engineer
- [ ] Unit tests for business logic (>80% coverage)
- [ ] No TypeScript errors
- [ ] Responsive on mobile (375px+)
- [ ] Error states handled gracefully`,
  },
  {
    name: "marketing_agent",
    title: "Marketing Agent",
    emoji: "📣",
    systemPrompt:
      "You are a world-class growth marketer and copywriter. You write copy that converts. Be specific, bold, and human — never corporate. Every word earns its place.",
    userPromptTemplate: (idea, context) => `
Create a complete marketing launch kit for: "${idea}"

Business context: ${context}

Produce:
1. **Tagline** – 3 options, punchy and memorable
2. **Landing Page Copy** – Hero headline, subheadline, 3 feature blocks, CTA
3. **LinkedIn Launch Post** – Founder story format, 150-200 words
4. **Email Campaign** – 3-email onboarding sequence (subject + body for each)
5. **Product Hunt Description** – 260-char tagline + full description
6. **SEO Keywords** – 10 target keywords with search intent`,
    fallback: (idea) => `## Marketing Launch Kit

**Taglines**
1. "Your entire founding team. Powered by AI."
2. "From idea to execution in minutes, not months."
3. "The AI co-founder that never sleeps."

**Landing Page Copy**

_Hero_
**Headline:** Stop hiring. Start building.
**Subheadline:** One AI platform that validates your idea, researches your market, writes your PRD, designs your architecture, creates your GitHub issues, and launches your marketing — all before your first coffee.
**CTA:** → Validate My Idea Free

_Feature Blocks_
🎯 **Instant Validation** — Get brutal honest feedback from an AI advisor trained on 10,000 startup outcomes. No fluff, no cheerleading.
📊 **Real Market Research** — TAM, competitors, trends. The slides your investors want, generated in seconds.
⚙️ **Ship-Ready Engineering** — GitHub issues, DB schemas, API contracts. Hand them to any developer and build.

**LinkedIn Post**
I built a company in 20 minutes.

Not a real company. But everything a real company needs:
— Market research with TAM estimates
— A full PRD with user stories  
— Database schema and API design
— 10 GitHub issues ready to assign
— A landing page and launch email

All from one sentence: "AI-powered fitness coach."

I'm building [Startup Name] because founders waste months on documents that should take hours.

AI isn't replacing founders. It's replacing the 6 consultants they can't afford.

We're in early access. DM me "FOUNDER" for a free run.

**Email Sequence**

Email 1 — Welcome
Subject: Your startup team just clocked in
"You just gave 6 AI agents a job. Here's what they built for you in the last 60 seconds..."

Email 2 — Day 3
Subject: Your competitors don't know this yet
"The market research your agents ran flagged 3 things most founders miss. Take 5 minutes to read this..."

Email 3 — Day 7
Subject: Time to build
"Your GitHub issues are waiting. Your architecture is designed. The only thing left is you."`,
  },
  {
    name: "judge",
    title: "Judge",
    emoji: "⚖️",
    systemPrompt:
      "You are a skeptical, battle-tested startup judge — think Shark Tank crossed with a YC partner doing diligence. You have seen thousands of pitches fail for predictable reasons. Your job is to critique the work of the other 6 agents, not to be nice. Find the weakest claims, the unexamined assumptions, and the gaps between ambition and evidence. You MUST respond with valid JSON only — no markdown, no prose outside the JSON, no code fences.",
    userPromptTemplate: (idea, context) => `
Critique the full startup plan for: "${idea}"

Here is everything the other agents produced:
${context}

Return ONLY a JSON object with this exact shape (no markdown fences, no extra text):
{
  "overallScore": <number 0-100>,
  "verdict": "<GO|CONDITIONAL GO|NO-GO>",
  "dimensions": [
    {"key": "market", "label": "Market Opportunity", "score": <0-10>, "rationale": "<1-2 sentences>"},
    {"key": "product", "label": "Product Strength", "score": <0-10>, "rationale": "<1-2 sentences>"},
    {"key": "technical", "label": "Technical Feasibility", "score": <0-10>, "rationale": "<1-2 sentences>"},
    {"key": "goToMarket", "label": "Go-To-Market", "score": <0-10>, "rationale": "<1-2 sentences>"},
    {"key": "teamReadiness", "label": "Team/Execution Readiness", "score": <0-10>, "rationale": "<1-2 sentences>"}
  ],
  "critiques": [
    {"agent": "startup_advisor", "strengths": ["<short>", "<short>"], "weaknesses": ["<short>", "<short>"], "confidence": <0-100>},
    {"agent": "market_research", "strengths": [...], "weaknesses": [...], "confidence": <0-100>},
    {"agent": "product_manager", "strengths": [...], "weaknesses": [...], "confidence": <0-100>},
    {"agent": "software_architect", "strengths": [...], "weaknesses": [...], "confidence": <0-100>},
    {"agent": "engineering_manager", "strengths": [...], "weaknesses": [...], "confidence": <0-100>},
    {"agent": "marketing_agent", "strengths": [...], "weaknesses": [...], "confidence": <0-100>}
  ],
  "topRisks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "topActions": ["<action 1>", "<action 2>", "<action 3>"]
}

Be harsh but fair. A score of 7+/10 on a dimension should be rare and earned. Base weaknesses on what was actually written, not generic startup advice.`,
    fallback: () => JSON.stringify({
      overallScore: 58,
      verdict: "CONDITIONAL GO",
      dimensions: [
        { key: "market", label: "Market Opportunity", score: 6, rationale: "Market sizing relies on category-level estimates rather than idea-specific validation." },
        { key: "product", label: "Product Strength", score: 6, rationale: "MVP scope is reasonable but differentiation versus existing tools is thin." },
        { key: "technical", label: "Technical Feasibility", score: 7, rationale: "Stack choices are standard and buildable by a small team." },
        { key: "goToMarket", label: "Go-To-Market", score: 5, rationale: "Channels are listed but no evidence of early demand or willingness to pay." },
        { key: "teamReadiness", label: "Team/Execution Readiness", score: 5, rationale: "No information provided about founder/team capability to execute this plan." },
      ],
      critiques: [
        { agent: "startup_advisor", strengths: ["Clear problem framing"], weaknesses: ["Confidence score not backed by data"], confidence: 60 },
        { agent: "market_research", strengths: ["Named competitors"], weaknesses: ["TAM/SAM/SOM figures are generic, not sourced"], confidence: 55 },
        { agent: "product_manager", strengths: ["Concrete MVP feature list"], weaknesses: ["Success metrics are aspirational, not modeled"], confidence: 60 },
        { agent: "software_architect", strengths: ["Sensible, boring tech choices"], weaknesses: ["No discussion of what breaks at scale"], confidence: 65 },
        { agent: "engineering_manager", strengths: ["Issues are specific and actionable"], weaknesses: ["No estimate of total time-to-MVP"], confidence: 60 },
        { agent: "marketing_agent", strengths: ["Strong, human copy voice"], weaknesses: ["No evidence the messaging has been tested with real users"], confidence: 55 },
      ],
      topRisks: [
        "No primary validation (user interviews, pre-orders, or pilot usage) behind any claim",
        "Differentiation versus existing tools is asserted, not demonstrated",
        "Go-to-market assumes channels convert at unproven rates",
      ],
      topActions: [
        "Run 10-15 customer interviews before writing more code",
        "Ship the smallest possible version of the core workflow and measure real usage",
        "Validate willingness to pay with a pre-order or paid pilot before scaling spend",
      ],
    }),
  },
];

export function getAgent(name: AgentName): AgentDef {
  const agent = AGENTS.find((a) => a.name === name);
  if (!agent) throw new Error(`Agent ${name} not found`);
  return agent;
}
