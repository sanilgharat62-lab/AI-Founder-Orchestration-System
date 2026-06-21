import { NextRequest, NextResponse } from "next/server";
import { loadMemory, listMemory } from "@/lib/memory/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const memory = loadMemory(id);
    if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(memory);
  }

  const all = listMemory();
  return NextResponse.json(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}
