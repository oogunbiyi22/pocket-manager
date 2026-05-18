/**
 * Deezer API Proxy — FREE, no key required
 *
 * Real charts, artist info, track search.
 *
 * GET /api/deezer?endpoint=chart                    — global top tracks/artists/albums
 * GET /api/deezer?endpoint=search&q=artist+name     — search tracks
 * GET /api/deezer?endpoint=artist&id=123            — artist info
 * GET /api/deezer?endpoint=artist/123/top           — artist top tracks
 * GET /api/deezer?endpoint=album&id=456             — album info
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DEEZER_BASE = "https://api.deezer.com";

const ALLOWED: RegExp[] = [
  /^chart$/,
  /^chart\/\d+$/,
  /^search$/,
  /^artist\/\d+(\/top)?$/,
  /^album\/\d+$/,
  /^track\/\d+$/,
  /^playlist\/\d+$/,
];

const cache = new Map<string, { data: unknown; ts: number }>();
const CHART_TTL = 6 * 60 * 60 * 1000;  // charts: 6h
const SEARCH_TTL = 60 * 60 * 1000;     // search: 1h

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`deezer:${ip}`, 60, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") ?? "";

  const isAllowed = ALLOWED.some((r) => r.test(endpoint));
  if (!endpoint || !isAllowed) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  const forwardParams = new URLSearchParams();
  for (const [k, v] of searchParams.entries()) {
    if (k === "endpoint") continue;
    forwardParams.set(k, v);
  }

  const url = `${DEEZER_BASE}/${endpoint}${forwardParams.toString() ? `?${forwardParams.toString()}` : ""}`;
  const ttl = endpoint === "chart" ? CHART_TTL : SEARCH_TTL;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < ttl) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "PocketManager/1.0" },
    });
    if (!res.ok) return NextResponse.json({ error: `Deezer error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[deezer]", err);
    return NextResponse.json({ error: "Deezer request failed" }, { status: 502 });
  }
}
