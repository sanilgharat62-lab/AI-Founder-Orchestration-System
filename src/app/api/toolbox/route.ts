import { NextRequest, NextResponse } from "next/server";
import { runToolboxAction, ToolboxAction } from "@/lib/tools/toolbox";
import { saveToolRun } from "@/lib/database/tool-runs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as ToolboxAction;
    const result = await runToolboxAction(action, body);
    const saved = saveToolRun({
      memoryId: body.memoryId,
      startupName: body.startupName,
      action,
      title: result.title,
      summary: result.message,
      metadata: {
        query: body.query,
        url: body.url,
        resultCount: result.results?.length ?? 0,
        links: result.links,
      },
    });
    return NextResponse.json({ ...result, saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown toolbox error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
