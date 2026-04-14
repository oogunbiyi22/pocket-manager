import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const WaitlistSchema = z.object({
  email: z.string().email("Valid email required.").max(320),
  artistName: z.string().max(120).optional(),
  source: z.string().max(64).optional(),
});

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  // Rate limiting — 2 per minute per IP
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`waitlist:${ip}`, RATE_LIMITS.waitlist.limit, RATE_LIMITS.waitlist.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.message },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  try {
    const rawBody = await req.json();
    const parsed = WaitlistSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const { email, artistName, source } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { error } = await supabase.from("waitlist").insert({
      email: cleanEmail,
      artist_name: artistName?.trim() ?? null,
      source: source ?? "landing",
    });

    // Duplicate email is fine — just acknowledge
    if (error && !error.message.includes("duplicate") && !error.code?.includes("23505")) {
      console.error("[waitlist] Insert error:", error.message);
      return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
