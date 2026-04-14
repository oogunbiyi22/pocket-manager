import { streamText, type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest } from "next/server";
import {
  seedSongs,
  seedPlatformConnections,
  getRevenueGapSummary,
  getNextRevenueAction,
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

function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  const modelId = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";

  switch (provider) {
    case "openai":
      return createOpenAI()(modelId) as unknown as LanguageModel;
    case "google":
      return createGoogleGenerativeAI()(modelId) as unknown as LanguageModel;
    case "anthropic":
    default:
      return createAnthropic()(modelId) as unknown as LanguageModel;
  }
}

function buildSystemPrompt(
  artistName: string,
  songs: SongCatalogItem[],
  platforms: PlatformConnection[],
) {
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages?: unknown[];
      artistName?: string;
      songs?: SongCatalogItem[];
      platforms?: PlatformConnection[];
    };

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const artistName = (typeof body.artistName === "string" ? body.artistName : null) ?? "Artist";

    // Use live data from client if provided, fall back to seed data
    const songs = Array.isArray(body.songs) && body.songs.length > 0
      ? body.songs as SongCatalogItem[]
      : seedSongs;
    const platforms = Array.isArray(body.platforms) && body.platforms.length > 0
      ? body.platforms as PlatformConnection[]
      : seedPlatformConnections;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = streamText({
      model: getModel(),
      system: buildSystemPrompt(artistName, songs, platforms),
      messages: messages as any,
      maxOutputTokens: 400,
      temperature: 0.35,
    } as any);

    return result.toTextStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
