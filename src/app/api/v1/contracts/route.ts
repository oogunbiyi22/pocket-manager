/**
 * Contract Scanner — self-contained clause detection, no external AI required.
 * POST /api/v1/contracts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { scanContract } from "@/lib/pocket-brain";

const AnalyzeSchema = z.object({
  text: z.string().min(50).max(15000),
  contractType: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`contracts:${ip}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = AnalyzeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Send { text, contractType } with at least 50 chars of contract text." },
      { status: 400 },
    );
  }

  const analysis = scanContract(parsed.data.text, parsed.data.contractType);
  return NextResponse.json({ analysis });
}
