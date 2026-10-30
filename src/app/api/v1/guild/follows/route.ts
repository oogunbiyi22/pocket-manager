/**
 * Guild follows — who the signed-in user follows in the Guild.
 *
 * Storage: `guild_follows` (PATCH 006), one row per (follower, followed).
 * Until this route existed the follow state lived in localStorage and
 * vanished on a new device. RLS restricts rows to their follower; this
 * route additionally scopes every query to the authenticated user.
 *
 * Auth: Bearer token from Supabase session (requireApiUser).
 *
 * Graceful pre-migration behavior: until PATCH 006 runs, GET returns 200
 * with `persisted: false` and an empty list so the page falls back to its
 * localStorage state instead of crashing; writes return 503.
 */

import { NextRequest, NextResponse } from "next/server";
import { isMissingTable, requireApiUser } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const TABLE = "guild_follows";

function rateLimited(req: NextRequest, scope: string, limit: number) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`guild-follows:${scope}:${ip}`, limit, RATE_LIMITS.api.windowMs);
  if (rl.ok) return null;
  return NextResponse.json({ error: rl.message }, {
    status: 429,
    headers: { "Retry-After": String(rl.retryAfterSeconds) },
  });
}

function storageNotReady() {
  return NextResponse.json(
    { error: "Guild follow storage is not set up yet", persisted: false },
    { status: 503 },
  );
}

const MemberSchema = z.object({ memberId: z.string().uuid() });

/** GET /api/v1/guild/follows — the ids the signed-in user follows */
export async function GET(req: NextRequest) {
  const limited = rateLimited(req, "read", RATE_LIMITS.api.limit);
  if (limited) return limited;

  const auth = await requireApiUser(req);
  if (auth.response) return auth.response;

  const { data, error } = await auth.admin
    .from(TABLE)
    .select("followed_id")
    .eq("follower_id", auth.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingTable(error, TABLE)) {
      return NextResponse.json({ following: [], persisted: false });
    }
    console.error("[guild/follows] GET error:", error.message);
    return NextResponse.json({ error: "Could not load follows" }, { status: 500 });
  }

  return NextResponse.json({
    following: (data ?? []).map((row) => (row as { followed_id: string }).followed_id),
    persisted: true,
  });
}

/** POST /api/v1/guild/follows { memberId } — follow a member */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, "write", 30);
  if (limited) return limited;

  const auth = await requireApiUser(req);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = MemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid member id" }, { status: 400 });
  }
  if (parsed.data.memberId === auth.user.id) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  const { error } = await auth.admin
    .from(TABLE)
    .insert({ follower_id: auth.user.id, followed_id: parsed.data.memberId });

  if (error) {
    if (isMissingTable(error, TABLE)) return storageNotReady();
    // 23505 = already following — idempotent success.
    if (error.code !== "23505") {
      console.error("[guild/follows] POST error:", error.message);
      return NextResponse.json({ error: "Could not save follow" }, { status: 500 });
    }
  }

  return NextResponse.json({ following: true, persisted: true });
}

/** DELETE /api/v1/guild/follows { memberId } — unfollow a member */
export async function DELETE(req: NextRequest) {
  const limited = rateLimited(req, "write", 30);
  if (limited) return limited;

  const auth = await requireApiUser(req);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = MemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid member id" }, { status: 400 });
  }

  const { error } = await auth.admin
    .from(TABLE)
    .delete()
    .eq("follower_id", auth.user.id)
    .eq("followed_id", parsed.data.memberId);

  if (error) {
    if (isMissingTable(error, TABLE)) return storageNotReady();
    console.error("[guild/follows] DELETE error:", error.message);
    return NextResponse.json({ error: "Could not remove follow" }, { status: 500 });
  }

  return NextResponse.json({ following: false, persisted: true });
}
