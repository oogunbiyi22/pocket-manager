import { streamText, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  getRevenueGapSummary,
  getRevenueActionQueue,
  getCatalogReadinessScore,
  getReadinessLevel,
  getSongReadinessScore,
  getSongEstimatedGap,
  formatGapEstimate,
  formatMoney,
  type SongCatalogItem,
  type PlatformConnection,
} from "@/lib/backstage-data";

// ─── Input validation schema ────────────────────────────────────────────────
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).max(50).optional(),
  artistName: z.string().max(120).optional(),
  songs: z.array(z.unknown()).max(200).optional(),
  platforms: z.array(z.unknown()).max(50).optional(),
  plan: z.enum(["free", "pro", "elite"]).optional(),
});

// ─── Model selection ────────────────────────────────────────────────────────
function getModel(plan?: string): LanguageModel {
  if ((plan === "pro" || plan === "elite") && process.env.ANTHROPIC_API_KEY) {
    return createAnthropic()("claude-haiku-4-5-20251001") as unknown as LanguageModel;
  }

  const provider = process.env.AI_PROVIDER ?? "groq";
  const modelId = process.env.AI_MODEL ?? "llama-3.1-8b-instant";

  switch (provider) {
    case "groq":
      return createGroq({ apiKey: process.env.GROQ_API_KEY })(modelId) as unknown as LanguageModel;
    case "openai":
      return createOpenAI()(modelId) as unknown as LanguageModel;
    case "google":
      return createGoogleGenerativeAI()(modelId) as unknown as LanguageModel;
    case "anthropic":
      return createAnthropic()(modelId) as unknown as LanguageModel;
    default:
      if (process.env.GROQ_API_KEY) {
        return createGroq({ apiKey: process.env.GROQ_API_KEY })("llama-3.1-8b-instant") as unknown as LanguageModel;
      }
      return createAnthropic()(modelId) as unknown as LanguageModel;
  }
}

// ─── System prompt ──────────────────────────────────────────────────────────
function buildSystemPrompt(
  artistName: string,
  songs: SongCatalogItem[],
  platforms: PlatformConnection[],
) {
  const summary = getRevenueGapSummary(songs);
  const queue = getRevenueActionQueue(songs).slice(0, 3);
  const catalogReadiness = getCatalogReadinessScore(songs);
  const readinessLevel = getReadinessLevel(catalogReadiness);

  const connectedPlatforms = platforms.filter((p) => p.status === "connected").map((p) => p.name);
  const disconnectedPlatforms = platforms.filter((p) => p.status !== "connected").map((p) => `${p.name} (${p.missingStep})`);

  const catalogLines = songs
    .map((song) => {
      const readiness = getSongReadinessScore(song);
      const gap = getSongEstimatedGap(song);
      const missingStreams = song.revenueStreams
        .filter((s) => s.status !== "collecting")
        .map((s) => `${s.collectionBody}: ${formatGapEstimate(getSongEstimatedGap({ ...song, revenueStreams: [s] }))} gap`)
        .join(", ");
      return [
        `  • "${song.title}"`,
        `    ISRC: ${song.isrc || "none"} | ${song.streams.toLocaleString()} streams | ${readiness}/100 readiness`,
        `    Confirmed: ${formatMoney(song.revenueStreams.reduce((t, s) => t + s.actualAmount, 0))} | Gap: ${formatGapEstimate(gap)}`,
        missingStreams ? `    Missing paths: ${missingStreams}` : null,
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  const queueLines = queue
    .map((a, i) => `  ${i + 1}. ${a.action} via ${a.collectionBody} — "${a.songTitle}" — ${formatGapEstimate(a.estimatedValue)} — ${a.estimatedTime}`)
    .join("\n");

  return `You are A — the personal music industry manager inside Pocket Manager for ${artistName}.

ARTIST: ${artistName}
CATALOG READINESS: ${catalogReadiness}% (${readinessLevel})
TOTAL CONFIRMED: ${formatMoney(summary.totalSecured)} this quarter
TOTAL GAP: ${formatGapEstimate(summary.totalEstimatedGap)} uncollected across ${summary.songsWithGaps} of ${summary.totalSongs} songs

CATALOG (${songs.length} songs):
${catalogLines}

TOP PRIORITY ACTIONS:
${queueLines || "  All gaps closed."}

PLATFORMS CONNECTED: ${connectedPlatforms.join(", ") || "none"}
PLATFORMS MISSING: ${disconnectedPlatforms.slice(0, 5).join(" | ") || "none"}

BEHAVIOR RULES:
- Direct, confident, music-industry-fluent. Correct terminology. No explaining basics.
- Name the specific song, platform, dollar amount in every answer. Use the real account data above.
- Under 4 sentences unless giving numbered action steps.
- Never say: "Great question" / "Certainly" / "As an AI" / "I'd be happy to" / "I don't know" / "I cannot access".
- If data is missing from the account, say exactly what's needed and where to add it.
- You are their manager. Speak like one — direct, specific, actionable.
- When asked about the biggest gap: name the song and the specific dollar amount.
- When asked what to do next: give the #1 action from the queue above.`;
}

// ─── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting — 10 requests per minute per IP
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`chat:${ip}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: rl.message }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = ChatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { messages: rawMessages, artistName, plan } = parsed.data;

    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const safeArtistName = artistName ?? "Artist";

    // Sanitize artist name — strip HTML/script tags
    const cleanArtistName = safeArtistName.replace(/<[^>]*>/g, "").slice(0, 120);

    // Use live data from client if provided
    const songs = Array.isArray(parsed.data.songs) && parsed.data.songs.length > 0
      ? parsed.data.songs as SongCatalogItem[]
      : [];
    const platforms = Array.isArray(parsed.data.platforms) && parsed.data.platforms.length > 0
      ? parsed.data.platforms as PlatformConnection[]
      : [];

    const result = streamText({
      model: getModel(plan),
      system: buildSystemPrompt(cleanArtistName, songs, platforms),
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
      maxOutputTokens: 400,
      temperature: 0.35,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    // Never expose internal error details
    console.error("[chat] Handler error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Request failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
