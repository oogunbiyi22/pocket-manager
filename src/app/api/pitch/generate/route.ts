/**
 * Pitch Email Generator — self-contained, no external AI required.
 * POST /api/pitch/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { generatePitch } from "@/lib/pocket-brain";

const RequestSchema = z.object({
  artistName: z.string().max(120),
  artistContact: z.string().max(200).optional(),
  emotionalStory: z.string().max(1000).optional(),
  song: z.object({
    title: z.string().max(200),
    genre: z.string().max(100).optional(),
    mood: z.string().max(100).optional(),
    bpm: z.number().optional(),
    musicalKey: z.string().optional(),
    releaseDate: z.string().optional(),
    isrc: z.string().optional(),
  }),
  curator: z.object({
    name: z.string().max(200),
    playlistName: z.string().max(200),
    playlistType: z.string().max(100).optional(),
    genre: z.string().max(100).optional(),
    followers: z.string().max(50).optional(),
    platform: z.string().max(50).optional(),
    successRate: z.string().max(50).optional(),
    notes: z.string().max(300).optional(),
  }),
  plan: z.enum(["free", "pro", "elite"]).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`pitch:${ip}`, 20, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { subject, body: emailBody } = generatePitch(parsed.data);

  return NextResponse.json({
    subject,
    body: emailBody,
    full: `Subject: ${subject}\n\n${emailBody}`,
  });
}
