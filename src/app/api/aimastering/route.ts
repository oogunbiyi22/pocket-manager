/**
 * AI Mastering API Proxy
 *
 * Automated audio mastering. Requires AIMASTERING_API_KEY env var.
 * This is a premium feature — exposed via POST for mastering jobs.
 *
 * POST /api/aimastering/upload — upload audio file
 * POST /api/aimastering/master — create mastering job
 * GET  /api/aimastering/masterings/{id} — poll job status
 * GET  /api/aimastering/masterings/{id}/download — get download URL
 *
 * See https://aimastering.com/api_docs/ for full API.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BASE = "https://aimastering.com/api";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`aimastering:post:${ip}`, 5, 60 * 60 * 1000); // 5/hour — mastering is expensive
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const apiKey = process.env.AIMASTERING_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AIMASTERING_API_KEY not configured — add to Vercel env vars" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") ?? "";

  const ALLOWED = ["audios", "masterings", "masterings/{id}/execute"];
  const isAllowed = ALLOWED.some((p) => {
    const pattern = new RegExp("^" + p.replace(/\{[^}]+\}/g, "[^/]+") + "$");
    return pattern.test(endpoint);
  });

  if (!isAllowed) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  try {
    const body = await req.text();
    const res = await fetch(`${BASE}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": req.headers.get("content-type") ?? "application/json",
      },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[aimastering]", err);
    return NextResponse.json({ error: "AI Mastering request failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`aimastering:get:${ip}`, 30, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429 });

  const apiKey = process.env.AIMASTERING_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AIMASTERING_API_KEY not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") ?? "";

  if (!endpoint.startsWith("masterings")) {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/${endpoint}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[aimastering]", err);
    return NextResponse.json({ error: "AI Mastering request failed" }, { status: 502 });
  }
}
