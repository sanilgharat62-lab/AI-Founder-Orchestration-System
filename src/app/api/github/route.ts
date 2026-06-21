import { NextRequest, NextResponse } from "next/server";
import { createGitHubIssue, parseIssuesFromOutput } from "@/lib/tools/github";
import { loadMemory } from "@/lib/memory/store";

export async function POST(req: NextRequest) {
  const { memoryId, owner, repo } = await req.json();
  if (!memoryId || !owner || !repo) {
    return NextResponse.json({ error: "memoryId, owner, and repo are required" }, { status: 400 });
  }

  const memory = loadMemory(memoryId);
  if (!memory) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const emOutput = memory.agentOutputs["engineering_manager"];
  if (!emOutput) return NextResponse.json({ error: "No engineering manager output found" }, { status: 400 });

  const issues = parseIssuesFromOutput(emOutput);
  const results = await Promise.all(issues.map((issue) => createGitHubIssue(owner, repo, issue)));

  const created = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return NextResponse.json({ created: created.length, failed: failed.length, issues: results });
}
