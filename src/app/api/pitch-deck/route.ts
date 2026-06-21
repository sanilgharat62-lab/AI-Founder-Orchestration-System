import { NextRequest, NextResponse } from "next/server";
import { loadMemory } from "@/lib/memory/store";
import { generatePitchDeckMarkdown } from "@/lib/tools/toolbox";
import { saveToolRun } from "@/lib/database/tool-runs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("id");
  if (!memoryId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const memory = loadMemory(memoryId);
  if (!memory) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  saveToolRun({
    memoryId,
    startupName: memory.startupName,
    action: "pitch-deck",
    title: "Pitch Deck",
    summary: "Generated investor deck draft with problem, market, product, moat, GTM, model, roadmap, and ask.",
  });

  return new NextResponse(generatePitchDeckMarkdown(memory), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${memory.startupName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-pitch-deck.md"`,
    },
  });
}
