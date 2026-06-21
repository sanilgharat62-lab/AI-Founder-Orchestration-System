import { NextRequest, NextResponse } from "next/server";
import { listToolRuns } from "@/lib/database/tool-runs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memoryId = searchParams.get("memoryId") ?? undefined;
  return NextResponse.json({ records: listToolRuns(memoryId) });
}
