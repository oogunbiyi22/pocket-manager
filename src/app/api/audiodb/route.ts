/**
 * TheAudioDB API Proxy
 *
 * Free tier uses API key "2" — premium requires AUDIODB_API_KEY env var.
 * GET /api/audiodb?endpoint=searchartists&s=ArtistName
 * GET /api/audiodb?endpoint=searchtrack&s=ArtistName&t=TrackTitle
 * GET /api/audiodb?endpoint=discography&s=ArtistName
 * GET /api/audiodb?endpoint=searchalbum&s=ArtistName&a=AlbumTitle
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_ENDPOINTS = new Set([
  "searchartists", "searchtrack", "searchalbum", "discography",
  "artist", "album", "track", "track-section", "thumbnail",
  "mostloved", "charttop", "search",
]);

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 12 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`audiodb:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const apiKey = process.env.AUDIODB_API_KEY ?? "2"; // free tier key
  const params = new URLSearchParams(Object.fromEntries(
    [...searchParams.entries()].filter(([k]) => k !== "endpoint"),
  ));
  const url = `https://www.theaudiodb.com/api/v1/json/${apiKey}/${endpoint}.php?${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ error: `AudioDB error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[audiodb]", err);
    return NextResponse.json({ error: "AudioDB request failed" }, { status: 502 });
  }
}
