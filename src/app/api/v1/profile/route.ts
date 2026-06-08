/**
 * Profile sync endpoint — persists user profile data to Supabase.
 * Called by PocketProvider after auth + any profile update.
 *
 * Auth: Bearer token from Supabase session
 * Rate limit: 60 per minute
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const ProfileSyncSchema = z.object({
  artistName: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  vibe: z.string().max(120).optional(),
  email: z.string().email().max(320).optional(),
  plan: z.enum(["free", "pro", "elite"]).optional(),
  onboarded: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`profile:${ip}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  // Extract Bearer token from Authorization header
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Verify the token by getting the user — this validates the JWT
  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  // Validate input
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ProfileSyncSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }

  // Use service role to upsert (RLS may not allow anon user to create their own profile)
  if (!serviceKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });

  // NOTE: profiles has no `email` column — email lives in auth.users.
  // Writing it here makes Supabase reject the whole upsert and silently
  // drop every profile field (this was the onboarding-not-saving bug).
  const upsertData: Record<string, unknown> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.artistName !== undefined) upsertData.artist_name = parsed.data.artistName;
  if (parsed.data.role !== undefined) upsertData.role = parsed.data.role;
  if (parsed.data.vibe !== undefined) upsertData.vibe = parsed.data.vibe;
  if (parsed.data.onboarded !== undefined) upsertData.onboarded = parsed.data.onboarded;
  // Never update plan from client — only from Stripe webhook

  const { error: upsertError } = await adminClient
    .from("profiles")
    .upsert(upsertData, { onConflict: "id" });

  if (upsertError) {
    console.error("[profile] Upsert error:", upsertError.message);
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`profile:${ip}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Validate the JWT first
  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  // Use service role to bypass RLS — user identity already verified above
  if (!serviceKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id, artist_name, role, vibe, plan, onboarded, stripe_customer_id, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
  }

  // email is not stored on profiles — surface it from the verified auth user.
  const withEmail = profile ? { ...profile, email: user.email ?? null } : null;

  return NextResponse.json({ profile: withEmail });
}
