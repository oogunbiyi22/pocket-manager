/**
 * Radiostats Enterprise API proxy (by Songstats).
 *
 * Tracks radio airplay across 50,000+ terrestrial and digital stations.
 * Uses the same SONGSTATS_API_KEY — contact api@songstats.com for access.
 *
 * Usage:
 *   GET /api/radiostats?endpoint=tracks/stats&isrc=...
 *   GET /api/radiostats?endpoint=artists/stats&spotify_artist_id=...
 *
 * Supported endpoints:
 *   artists/info | artists/stats | artists/historic_stats | artists/activities | artists/audience
 *   tracks/info | tracks/stats | tracks/historic_stats
 *
 * Auth: Bearer token from Supabase session (user must be signed in)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const RADIOSTATS_BASE = "https://api.songstats.com/enterprise/v1";

// Full Radiostats Enterprise API surface
const ALLOWED_ENDPOINTS = new Set([
  // Artists
  "artists/info",
  "artists/stats",
  "artists/historic_stats",
  "artists/activities",
  "artists/audience",
  "artists/audience/details",
  "artists/catalog",
  "artists/top_tracks",
  "artists/search",
  // Tracks
  "tracks/info",
  "tracks/stats",
  "tracks/historic_stats",
  "tracks/activities",
  "tracks/locations",
  "tracks/search",
  // Collaborators
  "collaborators/info",
  "collaborators/stats",
  "collaborators/historic_stats",
  "collaborators/activities",
  "collaborators/audience",
  "collaborators/audience/details",
  "collaborators/catalog",
  "collaborators/top_tracks",
  "collaborators/search",
  // Labels
  "labels/info",
  "labels/stats",
  "labels/historic_stats",
  "labels/activities",
  "labels/audience",
  "labels/catalog",
  "labels/top_tracks",
  "labels/search",
  // Stations
  "stations/station_request",
  // Meta
  "status",
  "definitions",
]);

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of cache) { if (v.expiresAt < now) cache.delete(k); }
  }
}

async function getAuthUser(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`radiostats:${ip}`, 30, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const apiKey = process.env.SONGSTATS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Radiostats API not configured" }, { status: 503 });
  }

  const searchParams = req.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint");
  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { error: "Invalid endpoint. Must be one of: " + [...ALLOWED_ENDPOINTS].join(", ") },
      { status: 400 },
    );
  }

  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== "endpoint") forwardParams.set(key, value);
  }
  // Radiostats uses source=radiostats to scope results to radio data
  if (!forwardParams.has("source")) forwardParams.set("source", "radiostats");

  const upstreamUrl = `${RADIOSTATS_BASE}/${endpoint}?${forwardParams.toString()}`;
  const cacheKey = `radiostats:${upstreamUrl}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", "X-Cache-Source": "radiostats" },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: {
        apikey: apiKey,
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
  } catch (err) {
    console.error("[radiostats] fetch error:", err);
    return NextResponse.json({ error: "Failed to reach Radiostats API" }, { status: 502 });
  }

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => "");
    console.error(`[radiostats] upstream ${upstream.status}:`, body);
    return NextResponse.json(
      { error: `Radiostats returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json({ error: "Invalid response from Radiostats" }, { status: 502 });
  }

  setCache(cacheKey, data);

  return NextResponse.json(data, {
    headers: { "X-Cache": "MISS", "X-Cache-Source": "radiostats" },
  });
}
