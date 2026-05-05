/**
 * Telegram webhook — receives messages from your bot.
 * Set via: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://pocketmanager.online/api/telegram/webhook
 *
 * Uses Claude Sonnet directly for all free-text AI replies.
 */
import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
  };
};

async function sendMessage(chatId: number, text: string, token: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function askClaude(userMessage: string, artistName: string): Promise<string> {
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    maxOutputTokens: 400,
    system: `You are A — the personal music industry manager for ${artistName}, operating via their Pocket Manager Telegram bot.

Be direct, sharp, and music-industry fluent. Under 4 sentences unless giving numbered steps.
Never say: "Great question" / "Certainly" / "As an AI" / "I'd be happy to".
Speak like a real manager texting the truth — specific, actionable, no fluff.
If asked about catalog, revenue, or stats, tell them to check pocketmanager.online for live data.
If asked for next steps or what to do, give the most practical move for an independent artist right now.`,
    messages: [{ role: "user", content: userMessage }],
  });

  return text.trim();
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false }, { status: 503 });

  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const msg = update.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;
  const text = msg.text.trim().toLowerCase();
  const rawText = msg.text.trim();
  const firstName = msg.from?.first_name ?? "Artist";

  // Command routing
  if (text === "/start" || text === "/help") {
    await sendMessage(chatId, `Hey ${firstName} 👋\n\nI'm your Pocket Manager AI manager. Talk to me like you'd talk to your manager — or use these commands:\n\n*/status* — catalog readiness + revenue gaps\n*/gaps* — your top uncollected revenue items\n*/next* — what to do right now\n*/income* — income breakdown\n\nOr just ask me anything. I'm on Claude Sonnet.`, token);
    return NextResponse.json({ ok: true });
  }

  if (text === "/status") {
    await sendMessage(chatId, `📊 *Catalog Status*\n\nOpen pocketmanager.online/harvest for your live readiness score and revenue gap total. Ask me what to do about any gap and I'll tell you.`, token);
    return NextResponse.json({ ok: true });
  }

  if (text === "/gaps" || text === "/next") {
    await sendMessage(chatId, `💰 *Revenue Gaps*\n\nYour gap queue is at pocketmanager.online/harvest. Ask me which platform to hit first and why — I'll give you the move.`, token);
    return NextResponse.json({ ok: true });
  }

  if (text === "/income") {
    await sendMessage(chatId, `💵 *Income*\n\nFull breakdown at pocketmanager.online/financial. Ask me how to increase any stream and I'll give you a specific next step.`, token);
    return NextResponse.json({ ok: true });
  }

  // Claude Sonnet for all free-text messages
  if (!process.env.ANTHROPIC_API_KEY) {
    await sendMessage(chatId, `Manager brain is offline — ANTHROPIC_API_KEY not set. Open pocketmanager.online to manage your release.`, token);
    return NextResponse.json({ ok: true });
  }

  try {
    const reply = await askClaude(rawText, firstName);
    if (reply) {
      await sendMessage(chatId, reply, token);
    } else {
      await sendMessage(chatId, `Open pocketmanager.online for your full manager dashboard and action queue.`, token);
    }
  } catch (err) {
    console.error("[telegram] Claude error:", err instanceof Error ? err.message : "unknown");
    await sendMessage(chatId, `Couldn't reach the manager brain right now. Try again in a moment or open pocketmanager.online.`, token);
  }

  return NextResponse.json({ ok: true });
}
