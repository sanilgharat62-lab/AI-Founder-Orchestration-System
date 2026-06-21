export type AgentName =
  | "startup_advisor"
  | "market_research"
  | "product_manager"
  | "software_architect"
  | "engineering_manager"
  | "marketing_agent"
  | "judge";

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface Citation {
  index: number;
  title: string;
  url: string;
}

export interface AgentResult {
  agent: AgentName;
  title: string;
  status: AgentStatus;
  output?: string;
  sections?: Section[];
  error?: string;
  durationMs?: number;
  citations?: Citation[];
}

export interface Section {
  heading: string;
  body: string;
}

export interface OrchestratorRequest {
  idea: string;
  uploadedFiles?: UploadedFile[];
  judgeMode?: boolean;
}

export interface OrchestratorResponse {
  startupName: string;
  idea: string;
  agents: AgentResult[];
  memoryId: string;
}

// --- Judge Mode / Founder Scorecard ---

export interface ScoreDimension {
  key: "market" | "product" | "technical" | "goToMarket" | "teamReadiness";
  label: string;
  score: number; // 0-10
  rationale: string;
}

export interface AgentCritique {
  agent: AgentName;
  strengths: string[];
  weaknesses: string[];
  confidence: number; // 0-100
}

export interface FounderScorecard {
  overallScore: number; // 0-100
  verdict: "GO" | "CONDITIONAL GO" | "NO-GO";
  dimensions: ScoreDimension[];
  critiques: AgentCritique[];
  topRisks: string[];
  topActions: string[];
}

export interface UploadedFile {
  name: string;
  content: string; // base64 or plain text
  type: string;
}

export interface MemoryStore {
  id: string;
  startupName: string;
  idea: string;
  createdAt: string;
  updatedAt: string;
  roadmaps: string[];
  documents: string[];
  agentOutputs: Record<AgentName, string>;
  citations?: Partial<Record<AgentName, Citation[]>>;
  scorecard?: FounderScorecard;
}

export type StreamEvent =
  | { type: "agent_start"; agent: AgentName; title: string }
  | {
      type: "agent_done";
      agent: AgentName;
      title: string;
      output: string;
      sections: Section[];
      durationMs: number;
      citations?: Citation[];
    }
  | { type: "agent_error"; agent: AgentName; title: string; error: string }
  | { type: "scorecard_done"; scorecard: FounderScorecard }
  | { type: "orchestrator_done"; startupName: string; memoryId: string }
  | { type: "error"; message: string };
