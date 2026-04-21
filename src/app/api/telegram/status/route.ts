import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, { status: 404 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json() as { ok: boolean; result?: { username?: string; first_name?: string } };
    if (data.ok) {
      return NextResponse.json({ ok: true, bot: data.result });
    }
    return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Telegram unreachable" }, { status: 502 });
  }
}
