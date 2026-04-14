/**
 * Catalog sync endpoint — persists the user's song catalog to Supabase.
 *
 * The catalog is stored as a single JSONB blob per user in the `user_catalogs` table:
 *   CREATE TABLE user_catalogs (
 *     user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *     songs    jsonb NOT NULL DEFAULT '[]',
 *     updated_at timestamptz NOT NULL DEFAULT now()
 *   );
 *   ALTER TABLE user_catalogs ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Owner access" ON user_catalogs USING (auth.uid() = user_id);
 *
 * Auth: Bearer token from Supabase session
 * Rate limit: 30 per minute
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const TABLE = "user_catalogs";

function getClients(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) return null;
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const admin = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;
  return { anon, admin };
}

async function getAuthUser(token: string) {
  const clients = getClients();
  if (!clients) return null;
  const { data: { user }, error } = await clients.anon.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Validate Bearer token header
function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

// Lenient schema — we only validate the outer shape, songs items are arbitrary
const PushSchema = z.object({
  songs: z.array(z.record(z.string(), z.unknown())).max(500),
});

/** GET /api/v1/catalog — load songs for the signed-in user */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`catalog:${ip}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const clients = getClients();
  if (!clients?.admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data, error } = await clients.admin
    .from(TABLE)
    .select("songs, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[catalog] GET error:", error.message);
    return NextResponse.json({ error: "Could not load catalog" }, { status: 500 });
  }

  return NextResponse.json({
    songs: (data?.songs as unknown[] | null) ?? [],
    updatedAt: data?.updated_at ?? null,
  });
}

/** POST /api/v1/catalog — push the full songs array (replaces existing) */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  // Slightly tighter limit for writes — 30/min
  const rl = checkRateLimit(`catalog:write:${ip}`, 30, RATE_LIMITS.api.windowMs);
  if (!rl.ok) {
    return NextResponse.json({ error: rl.message }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getAuthUser(token);
  if (!user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const clients = getClients();
  if (!clients?.admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { error } = await clients.admin
    .from(TABLE)
    .upsert(
      { user_id: user.id, songs: parsed.data.songs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[catalog] POST error:", error.message);
    return NextResponse.json({ error: "Could not save catalog" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
