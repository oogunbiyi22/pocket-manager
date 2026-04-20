/**
 * Genius API Proxy
 *
 * Requires GENIUS_ACCESS_TOKEN env var (client access token).
 * GET /api/genius?endpoint=search&q=artist+song
 * GET /api/genius?endpoint=songs/123
 * GET /api/genius?endpoint=artists/456
 * GET /api/genius?endpoint=artists/456/songs&sort=popularity
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_PREFIXES = ["search", "songs", "artists", "albums", "annotations", "web-pages"];

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 12 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`genius:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "GENIUS_ACCESS_TOKEN not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  if (!endpoint || !ALLOWED_PREFIXES.some((p) => endpoint.startsWith(p))) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const params = new URLSearchParams(
    Object.fromEntries([...searchParams.entries()].filter(([k]) => k !== "endpoint")),
  );
  const url = `https://api.genius.com/${endpoint}?${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) return NextResponse.json({ error: `Genius error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[genius]", err);
    return NextResponse.json({ error: "Genius request failed" }, { status: 502 });
  }
}
