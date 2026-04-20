/**
 * Genrenator API Proxy — FREE, no API key required
 *
 * Generates creative music genre combinations.
 * GET /api/genrenator — returns a random genre
 * GET /api/genrenator?count=5 — returns multiple genres
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`genrenator:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const count = Math.min(parseInt(searchParams.get("count") ?? "1"), 10);

  try {
    const results = await Promise.all(
      Array.from({ length: count }, () =>
        fetch("https://binaryjazz.us/wp-json/genrenator/v1/genre/").then((r) => r.json()),
      ),
    );
    return NextResponse.json(count === 1 ? results[0] : results);
  } catch (err) {
    console.error("[genrenator]", err);
    return NextResponse.json({ error: "Genrenator request failed" }, { status: 502 });
  }
}
