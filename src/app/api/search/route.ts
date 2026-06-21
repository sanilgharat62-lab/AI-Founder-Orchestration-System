import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/tools/search";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

  try {
    const results = await searchWeb(query);
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown search error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
