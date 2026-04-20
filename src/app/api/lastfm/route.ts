/**
 * Last.fm API Proxy
 *
 * Requires LASTFM_API_KEY env var.
 * GET /api/lastfm?method=artist.getSimilar&artist=...
 * GET /api/lastfm?method=artist.getInfo&artist=...
 * GET /api/lastfm?method=track.getInfo&artist=...&track=...
 * GET /api/lastfm?method=artist.getTopTracks&artist=...
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_METHODS = new Set([
  "artist.getSimilar", "artist.getInfo", "artist.getTopTracks", "artist.getTopAlbums",
  "artist.search", "track.getInfo", "track.getSimilar", "track.search",
  "album.getInfo", "album.search", "chart.getTopArtists", "chart.getTopTracks",
]);

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 6 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`lastfm:${ip}`, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "LASTFM_API_KEY not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method");
  if (!method || !ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const params = new URLSearchParams({ ...Object.fromEntries(searchParams), api_key: apiKey, format: "json" });
  const url = `https://ws.audioscrobbler.com/2.0/?${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: `Last.fm error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[lastfm]", err);
    return NextResponse.json({ error: "Last.fm request failed" }, { status: 502 });
  }
}
