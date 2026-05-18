import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { generateChatResponse } from "@/lib/pocket-brain";
import type { SongCatalogItem, PlatformConnection } from "@/lib/backstage-data";

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

function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/);

  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of words) {
        if (chunk) {
          controller.enqueue(encoder.encode(chunk));
          if (chunk.trim()) {
            await new Promise<void>(r => setTimeout(r, 14));
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
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

    const { messages: rawMessages, artistName, managerName, page } = parsed.data;
    const messages = Array.isArray(rawMessages) ? rawMessages : [];
    const lastMessage = [...messages].reverse().find(m => m.role === "user")?.content ?? "";

    const response = generateChatResponse({
      lastMessage,
      songs: (Array.isArray(parsed.data.songs) ? parsed.data.songs : []) as SongCatalogItem[],
      platforms: (Array.isArray(parsed.data.platforms) ? parsed.data.platforms : []) as PlatformConnection[],
      artistName: (artistName ?? "Artist").replace(/<[^>]*>/g, "").slice(0, 120),
      managerName: (managerName ?? "REMY").replace(/<[^>]*>/g, "").slice(0, 40),
      page,
    });

    return streamText(response);
  } catch (err) {
    console.error("[chat] error:", err instanceof Error ? err.message : "Unknown");
    return new Response(
      JSON.stringify({ error: "Request failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
