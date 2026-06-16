import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText, type ModelMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  getRevenueGapSummary,
  getRevenueActionQueue,
  getCatalogReadinessScore,
  getSongReadinessScore,
  getSongEstimatedGap,
  formatGapEstimate,
  formatMoney,
  type SongCatalogItem,
  type PlatformConnection,
} from "@/lib/backstage-data";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).max(50).optional(),
  artistName: z.string().max(120).optional(),
  managerName: z.string().max(40).optional(),
  page: z.string().max(40).optional(),
  songs: z.array(z.unknown()).max(200).optional(),
  platforms: z.array(z.unknown()).max(50).optional(),
  plan: z.enum(["free", "pro", "elite"]).optional(),
});

// Build a rich system prompt from real artist data
function buildSystemPrompt(
  artistName: string,
  managerName: string,
  songs: SongCatalogItem[],
  platforms: PlatformConnection[],
  plan: string,
): string {
  const lines: string[] = [];

  lines.push(
    `You are ${managerName} — ${artistName}'s music manager inside Pocket Manager.`,
    `You are sharp, direct, and deeply knowledgeable about the music industry.`,
    `You speak with authority. No corporate fluff, no vague generalities. Real numbers, real moves.`,
    `You know ${artistName}'s actual catalog and give specific advice based on their data.`,
    `Keep responses focused and actionable. When you list steps, number them. When you cite money, be specific.`,
    ``,
  );

  if (songs.length > 0) {
    const summary = getRevenueGapSummary(songs);
    const queue = getRevenueActionQueue(songs).slice(0, 5);
    const catalogReadiness = getCatalogReadinessScore(songs);

    lines.push(`=== ${artistName.toUpperCase()}'S CATALOG (live data) ===`);
    lines.push(`Songs: ${songs.length} | Catalog readiness: ${catalogReadiness}% | Confirmed income: ${formatMoney(summary.totalSecured)} | Open gap: ${formatGapEstimate(summary.totalEstimatedGap)}`);
    lines.push(``);

    for (const song of songs) {
      const readiness = getSongReadinessScore(song);
      const gap = getSongEstimatedGap(song);
      const meta = [song.isrc && `ISRC: ${song.isrc}`, song.releaseDate && `Released: ${song.releaseDate}`].filter(Boolean).join(" | ");
      lines.push(`• "${song.title}" — ${readiness}% ready${gap > 0 ? `, ${formatGapEstimate(gap)} uncollected gap` : ", no open gap"}${meta ? ` | ${meta}` : ""}`);
    }

    if (queue.length > 0) {
      lines.push(``);
      lines.push(`=== TOP PRIORITY ACTIONS ===`);
      queue.forEach((a, i) => {
        lines.push(`${i + 1}. ${a.action} via ${a.collectionBody} for "${a.songTitle}" — ${formatGapEstimate(a.estimatedValue)} — ${a.estimatedTime}`);
      });
    }
  } else {
    lines.push(`${artistName} hasn't added any songs yet. Help them get started and explain what's possible once their catalog is in.`);
  }

  const connected = platforms.filter((p) => p.status === "connected").map((p) => p.name);
  const missing = platforms.filter((p) => p.status !== "connected").map((p) => p.name);
  if (connected.length || missing.length) {
    lines.push(``);
    lines.push(`=== PLATFORMS ===`);
    if (connected.length) lines.push(`Connected: ${connected.join(", ")}`);
    if (missing.length) lines.push(`Not connected: ${missing.join(", ")}`);
  }

  lines.push(``);
  lines.push(`Plan: ${plan}. Current date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`);

  return lines.join("\n");
}

/**
 * Pick the model for a plan. Gemini is the default rail (generous free tier,
 * strong for structured manager advice); Elite gets Claude when an Anthropic
 * key is present, otherwise falls back to Gemini Pro.
 *   free / pro → gemini-2.0-flash
 *   elite      → claude (if ANTHROPIC_API_KEY) else gemini-1.5-pro
 */
function selectModel(plan: string) {
  // TEST PATH: if an OpenRouter key is present, route everything through it
  // (OpenAI-compatible). Lets us validate the Gemini model live before we have
  // a dedicated Gemini key. Unplug by clearing OPENROUTER_API_KEY.
  if (process.env.OPENROUTER_API_KEY) {
    const openrouter = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    const model = plan === "elite"
      ? (process.env.OPENROUTER_ELITE_MODEL || "google/gemini-2.5-pro")
      : (process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001");
    return openrouter(model);
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
  });

  if (plan === "elite") {
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic(process.env.ELITE_AI_MODEL || "claude-sonnet-4-6");
    }
    return google(process.env.ELITE_AI_MODEL || "gemini-1.5-pro");
  }

  return google(process.env.AI_MODEL || "gemini-2.0-flash");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`chat:${ip}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: rl.message }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) } },
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

    const { messages: rawMessages, artistName, managerName, plan } = parsed.data;
    const songs = (parsed.data.songs ?? []) as SongCatalogItem[];
    const platforms = (parsed.data.platforms ?? []) as PlatformConnection[];

    const cleanName = (artistName ?? "Artist").replace(/<[^>]*>/g, "").slice(0, 120);
    const cleanManager = (managerName ?? "REMY").replace(/<[^>]*>/g, "").slice(0, 40);

    const systemPrompt = buildSystemPrompt(cleanName, cleanManager, songs, platforms, plan ?? "free");

    // Conversation history (last 10 user/assistant turns).
    const history: ModelMessage[] = (Array.isArray(rawMessages) ? rawMessages : [])
      .slice(-10)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const result = streamText({
      model: selectModel(plan ?? "free"),
      system: systemPrompt,
      messages: history,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    // Plain-text stream — matches the client's TextStreamChatTransport.
    return result.toTextStreamResponse();

  } catch (err) {
    console.error("[chat] error:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: "Request failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
