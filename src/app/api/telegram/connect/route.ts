/**
 * Register the Telegram webhook with the bot.
 * POST /api/telegram/connect  → sets webhook to production URL
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured in Vercel env vars" }, { status: 503 });
  }

  const origin = request.headers.get("origin") || `https://${request.headers.get("host")}`;
  const webhookUrl = `${origin}/api/telegram/webhook`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    return NextResponse.json({ ok: data.ok, webhook: webhookUrl, description: data.description });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
