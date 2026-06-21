import { NextRequest, NextResponse } from "next/server";
import { loadMemory } from "@/lib/memory/store";
import { generateTasksCsv } from "@/lib/tools/toolbox";
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
    action: "task-export",
    title: "Linear / Jira / Trello",
    summary: "Generated import-ready task plan with sprint, priority, owner, and acceptance criteria.",
  });

  return new NextResponse(generateTasksCsv(memory), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${memory.startupName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-tasks.csv"`,
    },
  });
}
