/**
 * iTunes Search API Proxy
 *
 * Search Apple Music catalog — no API key required.
 * GET /api/itunes?term=artist+name&entity=musicArtist|musicTrack|album
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 6 * 60 * 60 * 1000; // 6h

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`itunes:${ip}`, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const term = searchParams.get("term");
  if (!term) return NextResponse.json({ error: "term is required" }, { status: 400 });

  const params = new URLSearchParams({ term, limit: "10", ...Object.fromEntries(searchParams) });
  params.delete("term"); // avoid duplicate
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ error: `iTunes error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[itunes]", err);
    return NextResponse.json({ error: "iTunes request failed" }, { status: 502 });
  }
}
