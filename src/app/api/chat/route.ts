import { NextRequest, NextResponse } from "next/server";

const MCP_BASE = "https://ws.medistaxion.com/api/chat";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || "messages";
  const channel = searchParams.get("channel") || "general";
  const limit = searchParams.get("limit") || "30";
  const after_id = searchParams.get("after_id");

  const url = new URL(MCP_BASE);
  url.searchParams.set("action", action);
  url.searchParams.set("channel", channel);
  url.searchParams.set("limit", limit);
  if (after_id) url.searchParams.set("after_id", after_id);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
