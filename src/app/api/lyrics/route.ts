/**
 * Lyrics.ovh Proxy — FREE, no API key required
 *
 * GET /api/lyrics?artist=ArtistName&title=TrackTitle
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`lyrics:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist");
  const title = searchParams.get("title");
  if (!artist || !title) return NextResponse.json({ error: "artist and title are required" }, { status: 400 });

  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Lyrics not found" }, { status: res.status });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[lyrics]", err);
    return NextResponse.json({ error: "Lyrics request failed" }, { status: 502 });
  }
}
