/**
 * Telegram webhook — receives messages from your bot.
 * Set via: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://pocketmanager.online/api/telegram/webhook
 */
import { NextRequest, NextResponse } from "next/server";

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
  const firstName = msg.from?.first_name ?? "Artist";

  // Command routing
  if (text === "/start" || text === "/help") {
    await sendMessage(chatId, `Hey ${firstName} 👋\n\nI'm your Pocket Manager bot. Here's what I can do:\n\n*/status* — catalog readiness + revenue gap\n*/gaps* — your top uncollected revenue items\n*/next* — what to do right now\n*/income* — current income breakdown\n\nMore commands coming. Ship fast, collect everything.`, token);
    return NextResponse.json({ ok: true });
  }

  if (text === "/status") {
    await sendMessage(chatId, `📊 *Catalog Status*\n\nConnect your catalog at pocketmanager.online to get live stats here. Once connected, this command shows your readiness score and gap total.`, token);
    return NextResponse.json({ ok: true });
  }

  if (text === "/gaps" || text === "/next") {
    await sendMessage(chatId, `💰 *Revenue Gaps*\n\nVisit pocketmanager.online/harvest to see your full gap queue and take action on uncollected royalties.`, token);
    return NextResponse.json({ ok: true });
  }

  if (text === "/income") {
    await sendMessage(chatId, `💵 *Income Summary*\n\nVisit pocketmanager.online/financial for your full income breakdown by stream type.`, token);
    return NextResponse.json({ ok: true });
  }

  // AI manager fallback — forward to A
  try {
    const aiRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000" : "http://localhost:3000"}/api/v1/manager/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: msg.text }],
        artistName: firstName,
        songs: [],
        platforms: [],
        plan: "free",
      }),
    });

    if (aiRes.ok) {
      const reader = aiRes.body?.getReader();
      if (reader) {
        let reply = "";
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          // Extract text from AI SDK stream format
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try { reply += JSON.parse(line.slice(2)); } catch { /* skip */ }
            }
          }
        }
        if (reply.trim()) {
          await sendMessage(chatId, reply.trim(), token);
          return NextResponse.json({ ok: true });
        }
      }
    }
  } catch { /* fallback below */ }

  await sendMessage(chatId, `Got it. Open pocketmanager.online to take action — or try /help for available commands.`, token);
  return NextResponse.json({ ok: true });
}
