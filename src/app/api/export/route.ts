import { NextRequest, NextResponse } from "next/server";
import { loadMemory } from "@/lib/memory/store";
import { generatePDFHtml } from "@/lib/tools/pdf";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("id");
  if (!memoryId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const memory = loadMemory(memoryId);
  if (!memory) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  if (Object.keys(memory.agentOutputs).length === 0) {
    return NextResponse.json({ error: "No agent outputs yet" }, { status: 400 });
  }

  const html = generatePDFHtml(memory);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Startup-Name": encodeURIComponent(memory.startupName),
    },
  });
}
