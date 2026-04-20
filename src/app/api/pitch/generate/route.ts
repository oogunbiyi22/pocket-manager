/**
 * AI Pitch Generation API
 *
 * Generates hyper-personalized pitch emails using the song's emotional story
 * as the DNA. The emotional story is written once by the artist and powers
 * every pitch in their exact voice.
 *
 * POST /api/pitch/generate
 * Body: { song, curator, artistName, emotionalStory, artistContact }
 */

import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

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

function getModel(plan?: string): LanguageModel {
  if ((plan === "pro" || plan === "elite") && process.env.ANTHROPIC_API_KEY) {
    return createAnthropic()("claude-haiku-4-5-20251001") as unknown as LanguageModel;
  }
  if (process.env.GROQ_API_KEY) {
    return createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.3-70b-versatile") as unknown as LanguageModel;
  }
  return createAnthropic()("claude-haiku-4-5-20251001") as unknown as LanguageModel;
}

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

  const { artistName, artistContact, emotionalStory, song, curator, plan } = parsed.data;

  const systemPrompt = `You are a music industry outreach specialist writing pitch emails for independent artists.
You write in the artist's exact voice — raw, real, human. Not corporate. Not begging.
Your pitches are short (under 150 words), specific to the playlist, and emotionally grounded.
Never say "I hope this email finds you well." Never say "I'd love to be considered."
Always write the subject line first, then a blank line, then the email body.
Format:
Subject: [subject line]

[email body]`;

  const userPrompt = `Write a pitch email from ${artistName} to ${curator.name} for their playlist "${curator.playlistName}".

SONG: "${song.title}"
Genre: ${song.genre ?? "not set"}
Mood: ${song.mood ?? "not set"}
BPM: ${song.bpm ?? "not provided"}
Released: ${song.releaseDate ?? "recent"}
ISRC: ${song.isrc ?? "available on request"}
${emotionalStory ? `\nEMOTIONAL STORY (write from this place — this is how the artist actually felt making it):\n"${emotionalStory}"` : ""}

PLAYLIST: "${curator.playlistName}"
Platform: ${curator.platform ?? "Spotify"}
Genre focus: ${curator.genre ?? curator.playlistType ?? "not specified"}
Followers: ${curator.followers ?? "unknown"}
${curator.notes ? `Curator notes: ${curator.notes}` : ""}

Artist contact: ${artistContact ?? "available on request"}

Write a short, real pitch in ${artistName}'s voice. Reference the emotional story if provided — it's the soul of the pitch. Make it feel like a real human sent it, not a template.`;

  try {
    const { text } = await generateText({
      model: getModel(plan),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 300,
      temperature: 0.7,
    } as Parameters<typeof generateText>[0]);

    // Parse subject and body from response
    const lines = text.trim().split("\n");
    const subjectLine = lines.find((l) => l.toLowerCase().startsWith("subject:"));
    const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, "").trim() : `${artistName} — "${song.title}" for ${curator.playlistName}`;
    const bodyStart = subjectLine ? lines.indexOf(subjectLine) + 1 : 0;
    const emailBody = lines.slice(bodyStart).join("\n").trim();

    return NextResponse.json({ subject, body: emailBody, full: text });
  } catch (err) {
    console.error("[pitch/generate] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Generation failed. Try again." }, { status: 500 });
  }
}
