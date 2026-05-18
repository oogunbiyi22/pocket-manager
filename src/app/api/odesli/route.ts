/**
 * Odesli (song.link) API Proxy — FREE, no key required
 *
 * Resolves streaming links across all major DSPs from a URL or ISRC.
 * Returns a MusicFetch-compatible shape so it's a drop-in swap.
 *
 * GET /api/odesli?isrc=USUG11901472
 * GET /api/odesli?url=https://open.spotify.com/track/...
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ODESLI_BASE = "https://api.song.link/v1-alpha.1/links";

const PLATFORM_MAP: Record<string, string> = {
  spotify: "spotify",
  appleMusic: "appleMusic",
  youtube: "youtube",
  youtubeMusic: "youtubeMusic",
  deezer: "deezer",
  tidal: "tidal",
  amazonMusic: "amazonMusic",
  soundcloud: "soundcloud",
  pandora: "pandora",
  napster: "napster",
};

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`odesli:${ip}`, 20, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const isrc = searchParams.get("isrc");
  const rawUrl = searchParams.get("url");

  if (!isrc && !rawUrl) {
    return NextResponse.json({ error: "isrc or url required" }, { status: 400 });
  }

  const inputUrl = isrc ? `isrc:${isrc}` : rawUrl!;
  const cacheKey = inputUrl;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data);

  try {
    const params = new URLSearchParams({ url: inputUrl, songIfSingular: "true", userCountry: "US" });
    const res = await fetch(`${ODESLI_BASE}?${params.toString()}`, {
      headers: { "User-Agent": "PocketManager/1.0 (https://pocketmanager.online)" },
    });

    if (res.status === 404) {
      return NextResponse.json({ services: {} });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Odesli error ${res.status}` }, { status: 502 });
    }

    const raw = await res.json() as {
      pageUrl?: string;
      linksByPlatform?: Record<string, { url?: string; nativeAppUriMobile?: string }>;
    };

    // Normalize to MusicFetch-compatible { services: { platform: { url } } }
    const services: Record<string, { url: string }> = {};
    for (const [platform, normalized] of Object.entries(PLATFORM_MAP)) {
      const link = raw.linksByPlatform?.[platform];
      if (link?.url) services[normalized] = { url: link.url };
    }

    const out = { services, pageUrl: raw.pageUrl };
    cache.set(cacheKey, { data: out, ts: Date.now() });
    return NextResponse.json(out);
  } catch (err) {
    console.error("[odesli]", err);
    return NextResponse.json({ error: "Odesli request failed" }, { status: 502 });
  }
}
