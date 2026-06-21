import { NextRequest, NextResponse } from "next/server";
import { saveWaitlistLead } from "@/lib/database/tool-runs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const saved = saveWaitlistLead({
      memoryId: body.memoryId ? String(body.memoryId) : undefined,
      startupName: body.startupName ? String(body.startupName) : undefined,
      name: String(body.name ?? "").trim(),
      email,
      role: String(body.role ?? "").trim(),
    });

    return NextResponse.json({ saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown waitlist error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
