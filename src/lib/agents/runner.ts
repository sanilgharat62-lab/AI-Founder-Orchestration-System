import { AgentName, Section, Citation } from "@/types";
import { AgentDef } from "./definitions";
import { searchWeb, SearchResult } from "@/lib/tools/search";

function parseOutputToSections(output: string): Section[] {
  const sections: Section[] = [];
  const lines = output.split("\n");
  let current: Section | null = null;
  let bodyLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    const boldHeadingMatch = line.match(/^\*\*(.+?)\*\*/);

    if (headingMatch || boldHeadingMatch) {
      if (current) {
        current.body = bodyLines.join("\n").trim();
        sections.push(current);
      }
      current = { heading: (headingMatch?.[1] || boldHeadingMatch?.[1] || "").trim(), body: "" };
      bodyLines = [];
    } else if (current) {
      bodyLines.push(line);
    }
  }

  if (current) {
    current.body = bodyLines.join("\n").trim();
    sections.push(current);
  }

  if (sections.length === 0) {
    sections.push({ heading: "Output", body: output.trim() });
  }

  return sections;
}

/** Pulls live web evidence for an idea and formats it as numbered sources for prompt injection. */
async function gatherEvidence(idea: string): Promise<{ block: string; citations: Citation[] }> {
  try {
    const results: SearchResult[] = await searchWeb(idea);
    if (!results.length) return { block: "", citations: [] };

    const citations: Citation[] = results.map((r, i) => ({
      index: i + 1,
      title: r.title || r.url,
      url: r.url,
    }));

    const block = results
      .map((r, i) => `[${i + 1}] ${r.title || r.url}\n${r.url}\n${r.snippet}`)
      .join("\n\n");

    return { block, citations };
  } catch (err) {
    console.error("Evidence search failed:", err);
    return { block: "", citations: [] };
  }
}

/** Detects which [n] markers an agent actually used so we only surface citations it cited. */
function filterUsedCitations(output: string, citations: Citation[]): Citation[] {
  const used = new Set<number>();
  const matches = output.matchAll(/\[(\d+)\]/g);
  for (const m of matches) used.add(Number(m[1]));
  return citations.filter((c) => used.has(c.index));
}

export async function runAgent(
  agent: AgentDef,
  idea: string,
  context: string
): Promise<{ output: string; sections: Section[]; citations?: Citation[] }> {
  const apiKey = process.env.OPENAI_API_KEY;

  let evidenceBlock = "";
  let evidenceCitations: Citation[] = [];
  if (agent.evidenceEnabled) {
    const evidence = await gatherEvidence(idea);
    evidenceBlock = evidence.block;
    evidenceCitations = evidence.citations;
  }

  const userPrompt = agent.userPromptTemplate(idea, context);
  const fullPrompt = evidenceBlock
    ? `${userPrompt}\n\nWeb evidence sources (cite inline as [1], [2], etc. when used):\n\n${evidenceBlock}`
    : userPrompt;

  if (apiKey && apiKey.startsWith("sk-")) {
    try {
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: agent.systemPrompt },
          { role: "user", content: fullPrompt },
        ],
        max_tokens: 2000,
        temperature: agent.name === "judge" ? 0.3 : 0.7,
      });

      const output = response.choices[0]?.message?.content || agent.fallback(idea);

      if (agent.name === "judge") {
        // Judge returns raw JSON; no markdown section parsing or citations needed.
        return { output, sections: [{ heading: "Verdict", body: output }] };
      }

      const citations = agent.evidenceEnabled
        ? filterUsedCitations(output, evidenceCitations)
        : undefined;

      return { output, sections: parseOutputToSections(output), citations };
    } catch (err) {
      console.error(`OpenAI error for ${agent.name}:`, err);
    }
  }

  // Use fallback template
  const output = agent.fallback(idea);
  if (agent.name === "judge") {
    return { output, sections: [{ heading: "Verdict", body: output }] };
  }
  return { output, sections: parseOutputToSections(output) };
}

export function extractStartupName(idea: string): string {
  const words = idea.split(/\s+/).slice(0, 6);
  const cleaned = words
    .map((w) => w.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2).join("") + (Math.random() > 0.5 ? "ly" : "io");
  }
  return cleaned[0] + "AI";
}
