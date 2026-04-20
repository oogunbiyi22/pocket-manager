/**
 * Bandsintown API Proxy
 *
 * Requires BANDSINTOWN_APP_ID env var (your app name as ID).
 * GET /api/bandsintown?endpoint=artists/{artistName}/events
 * GET /api/bandsintown?endpoint=artists/{artistName}
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 2 * 60 * 60 * 1000; // events change — 2h cache

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`bandsintown:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const appId = process.env.BANDSINTOWN_APP_ID ?? "pocket-manager";

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });

  // Validate only artists/* endpoints for safety
  if (!endpoint.startsWith("artists/")) {
    return NextResponse.json({ error: "Only artists/* endpoints allowed" }, { status: 400 });
  }

  const params = new URLSearchParams({ ...Object.fromEntries(searchParams), app_id: appId });
  params.delete("endpoint");
  const url = `https://rest.bandsintown.com/${endpoint}?${params.toString()}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ error: `Bandsintown error ${res.status}` }, { status: 502 });
    const data = await res.json();
    cache.set(url, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[bandsintown]", err);
    return NextResponse.json({ error: "Bandsintown request failed" }, { status: 502 });
  }
}
