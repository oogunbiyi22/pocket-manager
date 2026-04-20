/**
 * Songstats Enterprise API proxy.
 *
 * Keeps SONGSTATS_API_KEY server-side and caches responses in-memory (24h TTL)
 * to stay within the 1000 req/30-day per-resource rate limit.
 *
 * Usage:
 *   GET /api/songstats?endpoint=artists/stats&spotify_artist_id=...
 *   GET /api/songstats?endpoint=tracks/stats&isrc=...
 *   GET /api/songstats?endpoint=artists/info&spotify_artist_id=...
 *
 * Supported Songstats endpoints (pass as `endpoint` param):
 *   artists/info | artists/stats | artists/historic_stats | artists/activities
 *   artists/audience | artists/catalog
 *   tracks/info | tracks/stats | tracks/historic_stats | tracks/playlists
 *
 * Auth: Bearer token from Supabase session (user must be signed in)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const SONGSTATS_BASE = "https://api.songstats.com/enterprise/v1";

// Allowed endpoint paths — full Songstats Enterprise API surface
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
  "artists/top_playlists",
  "artists/top_curators",
  "artists/top_commentors",
  "artists/songshare",
  "artists/search",
  "artists/link_request",
  "artists/track_request",
  // Tracks
  "tracks/info",
  "tracks/stats",
  "tracks/historic_stats",
  "tracks/activities",
  "tracks/locations",
  "tracks/comments",
  "tracks/songshare",
  "tracks/search",
  "tracks/link_request",
  // Collaborators
  "collaborators/info",
  "collaborators/stats",
  "collaborators/historic_stats",
  "collaborators/activities",
  "collaborators/audience",
  "collaborators/audience/details",
  "collaborators/catalog",
  "collaborators/top_tracks",
  "collaborators/top_playlists",
  "collaborators/top_curators",
  "collaborators/top_commentors",
  "collaborators/songshare",
  "collaborators/search",
  "collaborators/link_request",
  "collaborators/track_request",
  // Labels
  "labels/info",
  "labels/stats",
  "labels/historic_stats",
  "labels/activities",
  "labels/audience",
  "labels/audience/details",
  "labels/catalog",
  "labels/top_tracks",
  "labels/top_playlists",
  "labels/top_curators",
  "labels/top_commentors",
  "labels/songshare",
  "labels/search",
  "labels/link_request",
  "labels/track_request",
  // Meta
  "sources",
  "status",
  "definitions",
]);

// In-memory cache: cacheKey → { data, expiresAt }
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  // Prune stale entries if cache grows large
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
  // Rate limit: 30 Songstats proxy calls per minute per IP
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`songstats:${ip}`, 30, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  // Require signed-in user
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  // Validate API key is configured
  const apiKey = process.env.SONGSTATS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Songstats API not configured" }, { status: 503 });
  }

  // Parse and validate endpoint param
  const searchParams = req.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint");
  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { error: "Invalid endpoint. Must be one of: " + [...ALLOWED_ENDPOINTS].join(", ") },
      { status: 400 },
    );
  }

  // Forward all other query params to Songstats (isrc, spotify_artist_id, source, etc.)
  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== "endpoint") forwardParams.set(key, value);
  }

  const upstreamUrl = `${SONGSTATS_BASE}/${endpoint}?${forwardParams.toString()}`;
  const cacheKey = `songstats:${upstreamUrl}`;

  // Return cached result if fresh
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", "X-Cache-Source": "songstats" },
    });
  }

  // Fetch from Songstats
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
    console.error("[songstats] fetch error:", err);
    return NextResponse.json({ error: "Failed to reach Songstats API" }, { status: 502 });
  }

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => "");
    console.error(`[songstats] upstream ${upstream.status}:`, body);
    return NextResponse.json(
      { error: `Songstats returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json({ error: "Invalid response from Songstats" }, { status: 502 });
  }

  setCache(cacheKey, data);

  return NextResponse.json(data, {
    headers: { "X-Cache": "MISS", "X-Cache-Source": "songstats" },
  });
}
