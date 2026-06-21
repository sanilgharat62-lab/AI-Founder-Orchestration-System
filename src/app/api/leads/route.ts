import { NextRequest, NextResponse } from "next/server";
import { loadMemory } from "@/lib/memory/store";
import { generateLeadsCsv } from "@/lib/tools/toolbox";
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
    action: "crm-leads",
    title: "CRM Leads",
    summary: "Generated lead segments with buyers, sources, outreach angles, and qualification questions.",
  });

  return new NextResponse(generateLeadsCsv(memory), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${memory.startupName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-leads.csv"`,
    },
  });
}
