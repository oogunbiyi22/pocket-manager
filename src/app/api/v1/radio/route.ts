/**
 * Radio submission tracking — persists the Radio Directory's per-station
 * submission state to Supabase (until PATCH 006 / this route, /radio kept
 * it in localStorage while the equivalent venue/sync tracking persisted).
 *
 * Storage: `user_radio_submissions` (table from MASTER_RUNME; PATCH 006
 * made station_id nullable and added station_name + songs_submitted).
 * Seeded-directory stations are keyed by their uuid station_id; stations
 * from the static fallback list in /api/v1/radio-stations have non-uuid
 * ids, so those rows key on station_name instead. RLS restricts rows to
 * their owner; this route additionally scopes every query to the
 * authenticated user.
 *
 * Auth: Bearer token from Supabase session (requireApiUser).
 * Rate limit: reads use RATE_LIMITS.api, writes 30 per minute.
 *
 * Graceful pre-migration behavior: until PATCH 006 runs, GET returns 200
 * with `persisted: false` and an empty list so the page falls back to its
 * localStorage state instead of crashing; writes return 503.
 */

import { NextRequest, NextResponse } from "next/server";
import { isMissingTable, requireApiUser } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const TABLE = "user_radio_submissions";
const COLUMNS = "id, station_id, station_name, song_title, songs_submitted, status, submitted_at, updated_at";
const STATUSES = ["submitted", "added", "rejected", "played"] as const;

function rateLimited(req: NextRequest, scope: string, limit: number) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`radio:${scope}:${ip}`, limit, RATE_LIMITS.api.windowMs);
  if (rl.ok) return null;
  return NextResponse.json({ error: rl.message }, {
    status: 429,
    headers: { "Retry-After": String(rl.retryAfterSeconds) },
  });
}

function storageNotReady() {
  return NextResponse.json(
    { error: "Radio submission storage is not set up yet", persisted: false },
    { status: 503 },
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RadioRow = {
  id: string;
  station_id: string | null;
  station_name: string | null;
  song_title: string | null;
  songs_submitted: string[] | null;
  status: string;
  submitted_at: string;
  updated_at: string;
};

function toSubmission(row: RadioRow) {
  return {
    id: row.id,
    stationId: row.station_id,
    stationName: row.station_name ?? "",
    status: row.status,
    songTitle: row.song_title ?? "",
    songsSubmitted: row.songs_submitted ?? (row.song_title ? [row.song_title] : []),
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

const UpsertSchema = z.object({
  stationId: z.string().max(100).nullable().optional(),
  stationName: z.string().trim().min(1).max(300),
  status: z.enum([...STATUSES, "not_submitted"]),
  songsSubmitted: z.array(z.string().trim().min(1).max(300)).max(50).optional().default([]),
});

/** GET /api/v1/radio — the signed-in user's radio submission states */
export async function GET(req: NextRequest) {
  const limited = rateLimited(req, "read", RATE_LIMITS.api.limit);
  if (limited) return limited;

  const auth = await requireApiUser(req);
  if (auth.response) return auth.response;

  const { data, error } = await auth.admin
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTable(error, TABLE)) {
      return NextResponse.json({ submissions: [], persisted: false });
    }
    console.error("[radio] GET error:", error.message);
    return NextResponse.json({ error: "Could not load radio submissions" }, { status: 500 });
  }

  return NextResponse.json({
    submissions: ((data ?? []) as RadioRow[]).map(toSubmission),
    persisted: true,
  });
}

/**
 * POST /api/v1/radio — upsert one station's submission state.
 * status "not_submitted" deletes the row (that's the page's empty state).
 */
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
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const stationId = d.stationId && UUID_RE.test(d.stationId) ? d.stationId : null;

  if (d.status === "not_submitted") {
    let del = auth.admin.from(TABLE).delete().eq("user_id", auth.user.id);
    del = stationId ? del.eq("station_id", stationId) : del.eq("station_name", d.stationName);
    const { error } = await del;
    if (error) {
      if (isMissingTable(error, TABLE)) return storageNotReady();
      console.error("[radio] POST delete error:", error.message);
      return NextResponse.json({ error: "Could not clear submission" }, { status: 500 });
    }
    return NextResponse.json({ cleared: true, persisted: true });
  }

  const songs = [...new Set(d.songsSubmitted)];
  const row = {
    user_id: auth.user.id,
    station_id: stationId,
    station_name: d.stationName,
    song_title: songs[songs.length - 1] ?? null,
    songs_submitted: songs,
    status: d.status,
    updated_at: new Date().toISOString(),
  };

  let lookup = auth.admin.from(TABLE).select("id").eq("user_id", auth.user.id);
  lookup = stationId ? lookup.eq("station_id", stationId) : lookup.eq("station_name", d.stationName);
  const { data: existing, error: readError } = await lookup.maybeSingle();
  if (readError) {
    if (isMissingTable(readError, TABLE)) return storageNotReady();
    console.error("[radio] POST read error:", readError.message);
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }

  const query = existing
    ? auth.admin.from(TABLE).update(row).eq("id", (existing as { id: string }).id).eq("user_id", auth.user.id)
    : auth.admin.from(TABLE).insert(row);
  const { data, error } = await query.select(COLUMNS);

  if (error) {
    if (isMissingTable(error, TABLE)) return storageNotReady();
    console.error("[radio] POST error:", error.message);
    return NextResponse.json({ error: "Could not save submission" }, { status: 500 });
  }

  const saved = (data as RadioRow[] | null)?.[0];
  if (!saved) return NextResponse.json({ error: "Submission not saved" }, { status: 500 });
  return NextResponse.json({ submission: toSubmission(saved), persisted: true });
}
