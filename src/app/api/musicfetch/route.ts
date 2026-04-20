/**
 * MusicFetch API Proxy
 *
 * Resolves a track across 40+ streaming platforms from an ISRC or Spotify URL.
 * Requires MUSICFETCH_TOKEN env var.
 *
 * GET /api/musicfetch?isrc=USUG11901472
 * GET /api/musicfetch?url=https://open.spotify.com/track/...
 *
 * Returns streaming links for all major DSPs.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const SERVICES = [
  "amazon", "amazonMusic", "anghami", "appleMusic", "audiomack", "audius", "awa",
  "bandcamp", "beatport", "boomplay", "deezer", "discogs", "flo", "gaana", "genius",
  "iHeartRadio", "instagram", "jioSaavn", "joox", "kkbox", "lineMusic", "musicBrainz",
  "napster", "netease", "pandora", "qobuz", "qqMusic", "sevenDigital", "shazam",
  "soundcloud", "spotify", "telmoreMusik", "tidal", "tiktok", "trebel", "yandex",
  "youseeMusik", "youtube", "youtubeMusic", "youtubeShorts",
].join(",");

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`musicfetch:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const token = process.env.MUSICFETCH_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "MUSICFETCH_TOKEN not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const isrc = searchParams.get("isrc");
  const upc = searchParams.get("upc");
  const url = searchParams.get("url");

  if (!isrc && !upc && !url) {
    return NextResponse.json({ error: "isrc, upc, or url is required" }, { status: 400 });
  }

  const cacheKey = isrc ? `isrc:${isrc}` : upc ? `upc:${upc}` : `url:${url}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    let endpoint: string;
    if (isrc) {
      endpoint = `https://api.musicfetch.io/isrc?isrc=${encodeURIComponent(isrc)}&services=${SERVICES}`;
    } else if (upc) {
      endpoint = `https://api.musicfetch.io/upc?upc=${encodeURIComponent(upc)}&services=${SERVICES}`;
    } else {
      endpoint = `https://api.musicfetch.io/url?url=${encodeURIComponent(url!)}&services=${SERVICES}`;
    }

    const res = await fetch(endpoint, {
      headers: { "x-token": token, Accept: "application/json" },
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[musicfetch]", res.status, err);
      return NextResponse.json({ error: `MusicFetch error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    cache.set(cacheKey, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[musicfetch]", err);
    return NextResponse.json({ error: "MusicFetch request failed" }, { status: 502 });
  }
}
