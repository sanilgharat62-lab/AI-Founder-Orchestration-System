import { FounderScorecard } from "@/types";

/**
 * Parses the Judge agent's raw output into a FounderScorecard.
 * The model is instructed to return pure JSON, but defensively strips
 * markdown code fences in case the model wraps it anyway.
 */
export function parseScorecard(rawOutput: string): FounderScorecard | null {
  try {
    const cleaned = rawOutput
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.overallScore !== "number" ||
      typeof parsed.verdict !== "string" ||
      !Array.isArray(parsed.dimensions) ||
      !Array.isArray(parsed.critiques)
    ) {
      return null;
    }

    return {
      overallScore: clamp(parsed.overallScore, 0, 100),
      verdict: ["GO", "CONDITIONAL GO", "NO-GO"].includes(parsed.verdict)
        ? parsed.verdict
        : "CONDITIONAL GO",
      dimensions: parsed.dimensions.map((d: { key?: string; label?: string; score?: number; rationale?: string }) => ({
        key: d.key ?? "market",
        label: d.label ?? "Dimension",
        score: clamp(Number(d.score) || 0, 0, 10),
        rationale: d.rationale ?? "",
      })),
      critiques: parsed.critiques.map((c: { agent?: string; strengths?: string[]; weaknesses?: string[]; confidence?: number }) => ({
        agent: c.agent ?? "startup_advisor",
        strengths: Array.isArray(c.strengths) ? c.strengths.slice(0, 5) : [],
        weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses.slice(0, 5) : [],
        confidence: clamp(Number(c.confidence) || 0, 0, 100),
      })),
      topRisks: Array.isArray(parsed.topRisks) ? parsed.topRisks.slice(0, 5) : [],
      topActions: Array.isArray(parsed.topActions) ? parsed.topActions.slice(0, 5) : [],
    };
  } catch (err) {
    console.error("Failed to parse judge scorecard:", err);
    return null;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
