/**
 * TasteDive Similar Artist API Proxy
 *
 * Requires TASTEDIVE_API_KEY env var.
 * GET /api/tastedive?q=ArtistName&type=music&limit=5
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 12 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`tastedive:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const apiKey = process.env.TASTEDIVE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "TASTEDIVE_API_KEY not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

  const params = new URLSearchParams({
    q, type: searchParams.get("type") ?? "music",
    limit: searchParams.get("limit") ?? "10",
    info: "1",
    k: apiKey,
  });
  const url = `https://tastedive.com/api/similar?${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: `TasteDive error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[tastedive]", err);
    return NextResponse.json({ error: "TasteDive request failed" }, { status: 502 });
  }
}
