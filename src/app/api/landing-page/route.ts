import { NextRequest, NextResponse } from "next/server";
import { loadMemory } from "@/lib/memory/store";
import { generateLandingPageHtml } from "@/lib/tools/toolbox";
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
    action: "landing-page",
    title: "Landing Page",
    summary: "Generated polished waitlist page with thesis, product promise, and validation call to action.",
  });

  return new NextResponse(generateLandingPageHtml(memory), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${memory.startupName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-landing-page.html"`,
    },
  });
}
