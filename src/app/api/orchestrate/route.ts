import { NextRequest } from "next/server";
import { AGENTS } from "@/lib/agents/definitions";
import { runAgent, extractStartupName } from "@/lib/agents/runner";
import { parseScorecard } from "@/lib/agents/scorecard";
import {
  createMemory,
  saveMemory,
  updateMemoryAgent,
  updateMemoryCitations,
  updateMemoryScorecard,
} from "@/lib/memory/store";
import { StreamEvent, AgentName } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function encode(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const idea: string = body.idea?.trim();
  const judgeMode: boolean = Boolean(body.judgeMode);

  if (!idea) {
    return new Response(encode({ type: "error", message: "No idea provided" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const startupName = extractStartupName(idea);
  const memory = createMemory(idea, startupName);
  saveMemory(memory);

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const write = (event: StreamEvent) => writer.write(encoder.encode(encode(event)));

  // Run agents sequentially so context from earlier agents can inform later ones
  const agentOrder: AgentName[] = [
    "startup_advisor",
    "market_research",
    "product_manager",
    "software_architect",
    "engineering_manager",
    "marketing_agent",
  ];

  (async () => {
    let accumulatedContext = `Startup Idea: ${idea}\nStartup Name: ${startupName}\n\n`;

    for (const agentName of agentOrder) {
      const agentDef = AGENTS.find((a) => a.name === agentName)!;
      await write({ type: "agent_start", agent: agentName, title: agentDef.title });

      const start = Date.now();
      try {
        const { output, sections, citations } = await runAgent(agentDef, idea, accumulatedContext);
        const durationMs = Date.now() - start;

        updateMemoryAgent(memory.id, agentName, output);
        if (citations?.length) updateMemoryCitations(memory.id, agentName, citations);
        accumulatedContext += `\n### ${agentDef.title} Output:\n${output.slice(0, 800)}\n`;

        await write({
          type: "agent_done",
          agent: agentName,
          title: agentDef.title,
          output,
          sections,
          durationMs,
          citations,
        });
      } catch (err) {
        await write({
          type: "agent_error",
          agent: agentName,
          title: agentDef.title,
          error: String(err),
        });
      }
    }

    // Judge Mode: optional 7th pass that critiques everything above
    if (judgeMode) {
      const judgeDef = AGENTS.find((a) => a.name === "judge")!;
      await write({ type: "agent_start", agent: "judge", title: judgeDef.title });

      const start = Date.now();
      try {
        const { output, sections } = await runAgent(judgeDef, idea, accumulatedContext);
        const durationMs = Date.now() - start;

        updateMemoryAgent(memory.id, "judge", output);

        const scorecard = parseScorecard(output);
        if (scorecard) {
          updateMemoryScorecard(memory.id, scorecard);
        }

        await write({
          type: "agent_done",
          agent: "judge",
          title: judgeDef.title,
          output,
          sections,
          durationMs,
        });

        if (scorecard) {
          await write({ type: "scorecard_done", scorecard });
        }
      } catch (err) {
        await write({
          type: "agent_error",
          agent: "judge",
          title: judgeDef.title,
          error: String(err),
        });
      }
    }

    await write({ type: "orchestrator_done", startupName, memoryId: memory.id });
    await writer.close();
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
