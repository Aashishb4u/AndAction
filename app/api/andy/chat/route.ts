import { NextRequest, NextResponse } from "next/server";
import { runAndy } from "@/lib/andy/agent";
import { getDeepSeekKey } from "@/lib/andy/env";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 12;
const MAX_CHARS = 500;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;

const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  if (!getDeepSeekKey()) {
    return NextResponse.json({ error: "Andy is not available right now." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many messages. Please wait a minute." }, { status: 429 });
  }

  let body: { messages?: { role?: string; content?: unknown }[]; location?: { lat?: unknown; lng?: unknown } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).trim().slice(0, MAX_CHARS),
    }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Send a message first." }, { status: 400 });
  }

  try {
    const lat = Number(body.location?.lat);
    const lng = Number(body.location?.lng);
    const location =
      Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
        ? { lat, lng }
        : null;
    const result = await runAndy(history, location);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Andy chat failed:", error);
    return NextResponse.json({ error: "Andy could not answer. Please try again." }, { status: 502 });
  }
}
