/**
 * Pitch Email Send API
 *
 * Sends pitch emails via Resend if RESEND_API_KEY is set,
 * otherwise returns the email content for manual sending.
 *
 * POST /api/pitch/send
 * Body: { to, subject, body, from, replyTo, pitchId }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const RequestSchema = z.object({
  to: z.string().email(),
  subject: z.string().max(300),
  body: z.string().max(3000),
  from: z.string().max(200).optional(),
  replyTo: z.string().email().optional(),
  pitchId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Strict rate limit on sends — 30/hour per IP
  const rl = checkRateLimit(`pitch:send:${ip}`, 30, 60 * 60 * 1000);
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

  const { to, subject, body: emailBody, replyTo, from } = parsed.data;

  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    // Send via Resend
    const fromAddress = from ?? process.env.PITCH_FROM_EMAIL ?? "Pocket Manager <pitches@pocketmanager.online>";

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
          "User-Agent": "pocket-manager/1.0",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          text: emailBody,
          reply_to: replyTo,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[pitch/send] Resend error:", res.status, errText);
        // Pass Resend 429 (rate limit / quota) through with Retry-After
        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after") ?? "60";
          return NextResponse.json({ error: "Email quota reached — try again shortly" }, {
            status: 429,
            headers: { "Retry-After": retryAfter },
          });
        }
        return NextResponse.json({ error: "Email delivery failed" }, { status: 502 });
      }

      const data = await res.json();
      return NextResponse.json({ ok: true, method: "resend", id: data.id });
    } catch (err) {
      console.error("[pitch/send] fetch error:", err);
      return NextResponse.json({ error: "Email delivery failed" }, { status: 502 });
    }
  }

  // No Resend key — return mailto fallback
  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  return NextResponse.json({
    ok: false,
    method: "mailto",
    mailtoUrl,
    message: "Add RESEND_API_KEY to send emails directly. Use mailtoUrl to open in your email client.",
  });
}
