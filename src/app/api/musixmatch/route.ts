/**
 * Musixmatch API Proxy
 *
 * Requires MUSIXMATCH_API_KEY env var.
 * GET /api/musixmatch?method=track.search&q_track=...&q_artist=...
 * GET /api/musixmatch?method=track.lyrics.get&track_isrc=...
 * GET /api/musixmatch?method=track.get&track_isrc=...
 * GET /api/musixmatch?method=artist.search&q_artist=...
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_METHODS = new Set([
  "track.search", "track.get", "track.lyrics.get", "track.snippet.get",
  "track.subtitle.get", "track.richsync.get", "track.translations.get",
  "artist.get", "artist.search", "artist.albums.get", "artist.related.get",
  "album.get", "album.tracks.get",
]);

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`musixmatch:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const apiKey = process.env.MUSIXMATCH_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "MUSIXMATCH_API_KEY not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method");
  if (!method || !ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const params = new URLSearchParams({ ...Object.fromEntries(searchParams), apikey: apiKey });
  const url = `https://api.musixmatch.com/ws/1.1/${method}?${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: `Musixmatch error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[musixmatch]", err);
    return NextResponse.json({ error: "Musixmatch request failed" }, { status: 502 });
  }
}
