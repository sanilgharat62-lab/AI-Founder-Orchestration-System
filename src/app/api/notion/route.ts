import { NextRequest, NextResponse } from "next/server";
import { publishToNotion } from "@/lib/tools/notion";
import { loadMemory } from "@/lib/memory/store";
import { AgentName } from "@/types";

export async function POST(req: NextRequest) {
  const { memoryId, agent } = await req.json();
  if (!memoryId) return NextResponse.json({ error: "memoryId required" }, { status: 400 });

  const memory = loadMemory(memoryId);
  if (!memory) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const agentLabels: Record<string, string> = {
    startup_advisor: "Startup Advisor",
    market_research: "Market Research",
    product_manager: "Product Manager",
    software_architect: "Software Architect",
    engineering_manager: "Engineering Manager",
    marketing_agent: "Marketing Agent",
  };

  // Publish a specific agent or all
  const targets = agent
    ? [[agent, memory.agentOutputs[agent as AgentName]]]
    : Object.entries(memory.agentOutputs);

  const results = await Promise.all(
    targets
      .filter(([, output]) => output)
      .map(([key, output]) =>
        publishToNotion(
          `${memory.startupName} — ${agentLabels[key as string] ?? key}`,
          output as string
        )
      )
  );

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return NextResponse.json({
    published: succeeded.length,
    failed: failed.length,
    pages: succeeded,
    errors: failed.map((f) => f.error),
  });
}
