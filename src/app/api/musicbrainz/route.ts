/**
 * MusicBrainz API Proxy
 *
 * Proxies requests to MusicBrainz open music database.
 * No API key required. Rate limited to 1 req/sec by MusicBrainz — we cache 24h.
 *
 * GET /api/musicbrainz?endpoint=recording&isrc=...
 * GET /api/musicbrainz?endpoint=artist&query=...
 * GET /api/musicbrainz?endpoint=release&query=...
 *
 * Common endpoints:
 *   recording?query=isrc:{ISRC}           — look up song by ISRC
 *   artist?query=artist:{name}            — search artist
 *   release?query=release:{title}&artist= — search release
 *   recording/{mbid}?inc=releases         — get recording details
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BASE = "https://musicbrainz.org/ws/2";
const USER_AGENT = "PocketManager/1.0 (https://pocketmanager.online)";

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

const ALLOWED_ENTITIES = new Set([
  "recording", "artist", "release", "release-group", "label", "work", "area", "place",
]);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`musicbrainz:${ip}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") ?? "";
  const [entity, mbid] = endpoint.split("/");

  if (!entity || !ALLOWED_ENTITIES.has(entity)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  // Build upstream URL
  const upstreamParams = new URLSearchParams({ fmt: "json" });
  for (const [k, v] of searchParams.entries()) {
    if (k === "endpoint") continue;
    upstreamParams.set(k, v);
  }

  const path = mbid ? `${entity}/${mbid}` : entity;
  const upstreamUrl = `${BASE}/${path}?${upstreamParams.toString()}`;

  const cached = cache.get(upstreamUrl);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(upstreamUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `MusicBrainz error ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    cache.set(upstreamUrl, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[musicbrainz]", err);
    return NextResponse.json({ error: "MusicBrainz request failed" }, { status: 502 });
  }
}
