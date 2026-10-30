/**
 * Playlist pitches endpoint — persists the Pitching Engine's work to
 * Supabase (until PATCH 005 / this route, /pitching kept curators, generated
 * pitches, and send states in useState and lost everything on refresh,
 * including the record of who had already been pitched).
 *
 * Storage: one row per (user, song, playlist) in `user_playlist_pitches`
 * (table from PATCH 002 / MASTER_RUNME; curator contact + pitch text
 * columns added by PATCH 005). RLS restricts rows to their owner; this
 * route additionally scopes every query to the authenticated user.
 *
 * Honest send states (see src/lib/pitch-status.ts): the mailto fallback
 * records "opened-in-mail" — never "sent". A row reaches "sent" only when
 * the server actually delivered the email or the artist explicitly marks
 * it sent. Transitions are validated server-side and only move forward.
 *
 * Auth: Bearer token from Supabase session (same pattern as /api/v1/beats)
 * Rate limit: reads use RATE_LIMITS.api, writes 30 per minute
 *
 * Graceful pre-migration behavior: until the owner runs the SQL, the table
 * (or its PATCH 005 columns) doesn't exist. GET then returns 200 with
 * `persisted: false` and an empty list so the page falls back to its old
 * in-memory behavior instead of crashing; writes return 503.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import {
  canTransitionSendState,
  dbStatusFromSendState,
  type PitchDbStatus,
  type PitchSendState,
} from "@/lib/pitch-status";
import { z } from "zod";

const TABLE = "user_playlist_pitches";
const COLUMNS =
  "id, playlist_name, curator_name, curator_email, curator_handle, platform, followers, genre, mood, fit_score, song_id, song_title, status, sent_date, pitch_subject, pitch_body";

function getClients() {
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

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

function rateLimited(req: NextRequest, scope: string, limit: number) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`pitches:${scope}:${ip}`, limit, RATE_LIMITS.api.windowMs);
  if (rl.ok) return null;
  return NextResponse.json({ error: rl.message }, {
    status: 429,
    headers: { "Retry-After": String(rl.retryAfterSeconds) },
  });
}

async function requireUser(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await getAuthUser(token);
  if (!user) {
    return { response: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
  const clients = getClients();
  if (!clients?.admin) {
    return { response: NextResponse.json({ error: "Service unavailable" }, { status: 503 }) };
  }
  return { user, admin: clients.admin };
}

// PostgREST reports a not-yet-created table as 42P01 (undefined table) or
// PGRST205 (not in schema cache); a missing PATCH 005 column surfaces as
// 42703 (undefined column) or PGRST204. All four mean "storage not set up".
function isMissingStorage(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (["42P01", "PGRST205", "42703", "PGRST204"].includes(error.code ?? "")) return true;
  return Boolean(
    error.message &&
      /does not exist|schema cache|could not find/i.test(error.message) &&
      /user_playlist_pitches|curator_|pitch_subject|pitch_body/i.test(error.message),
  );
}

function storageNotReady() {
  return NextResponse.json(
    { error: "Pitch storage is not set up yet", persisted: false },
    { status: 503 },
  );
}

type PitchRow = {
  id: string;
  playlist_name: string;
  curator_name: string | null;
  curator_email: string | null;
  curator_handle: string | null;
  platform: string | null;
  followers: string | null;
  genre: string | null;
  mood: string | null;
  fit_score: number | null;
  song_id: string;
  song_title: string;
  status: PitchDbStatus;
  sent_date: string | null;
  pitch_subject: string | null;
  pitch_body: string | null;
};

function toPitch(row: PitchRow) {
  return {
    id: row.id,
    songId: row.song_id,
    songTitle: row.song_title,
    playlistName: row.playlist_name,
    curatorName: row.curator_name ?? "",
    curatorEmail: row.curator_email ?? "",
    curatorHandle: row.curator_handle ?? "",
    platform: row.platform ?? "",
    followers: row.followers ?? "",
    genre: row.genre ?? "",
    mood: row.mood ?? "",
    fitScore: row.fit_score,
    subject: row.pitch_subject ?? "",
    body: row.pitch_body ?? "",
    status: row.status,
    sentDate: row.sent_date ?? "",
  };
}

const sendState = z.enum(["draft", "opened-in-mail", "sent"]);

const UpsertSchema = z.object({
  songId: z.string().min(1).max(200),
  songTitle: z.string().trim().min(1).max(300),
  playlistName: z.string().trim().min(1).max(300),
  curatorName: z.string().trim().max(200).optional().default(""),
  curatorEmail: z.string().trim().max(320).optional().default(""),
  curatorHandle: z.string().trim().max(200).optional().default(""),
  platform: z.string().trim().max(100).optional().default(""),
  followers: z.string().trim().max(50).optional().default(""),
  genre: z.string().trim().max(200).optional().default(""),
  mood: z.string().trim().max(200).optional().default(""),
  fitScore: z.number().int().min(0).max(100).nullable().optional(),
  subject: z.string().max(300).optional().default(""),
  body: z.string().max(10000).optional().default(""),
  sendState: sendState.optional().default("draft"),
});

const PatchSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().max(300).optional(),
  body: z.string().max(10000).optional(),
  sendState: sendState.optional(),
  // Downstream tracking states (Wave 3, for Signal's tracker): reachable
  // only from "sent", enforced by canTransitionSendState below.
  trackingStatus: z.enum(["replied", "placed", "declined"]).optional(),
}).refine(
  (value) => value.subject !== undefined || value.body !== undefined || value.sendState !== undefined || value.trackingStatus !== undefined,
  { message: "Nothing to update" },
);

/** GET /api/v1/pitches?songId= — the signed-in user's saved pitches */
export async function GET(req: NextRequest) {
  const limited = rateLimited(req, "read", RATE_LIMITS.api.limit);
  if (limited) return limited;

  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  let query = auth.admin
    .from(TABLE)
    .select(COLUMNS)
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });

  const songId = req.nextUrl.searchParams.get("songId");
  if (songId) query = query.eq("song_id", songId);

  const { data, error } = await query;

  if (error) {
    if (isMissingStorage(error)) {
      // Pre-migration: page falls back to in-memory mode.
      return NextResponse.json({ pitches: [], persisted: false });
    }
    console.error("[pitches] GET error:", error.message);
    return NextResponse.json({ error: "Could not load pitches" }, { status: 500 });
  }

  return NextResponse.json({
    pitches: ((data ?? []) as PitchRow[]).map(toPitch),
    persisted: true,
  });
}

/**
 * POST /api/v1/pitches — save a generated pitch (insert, or refresh the
 * content of the existing row for the same song + playlist). Saving content
 * never moves the send state backwards: re-generating a pitch for an
 * already-sent curator updates the text but keeps the sent record.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimited(req, "write", 30);
  if (limited) return limited;

  const auth = await requireUser(req);
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
  const content = {
    playlist_name: d.playlistName,
    curator_name: d.curatorName || null,
    curator_email: d.curatorEmail || null,
    curator_handle: d.curatorHandle || null,
    platform: d.platform || null,
    followers: d.followers || null,
    genre: d.genre || null,
    mood: d.mood || null,
    fit_score: d.fitScore ?? null,
    song_title: d.songTitle,
    pitch_subject: d.subject,
    pitch_body: d.body,
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await auth.admin
    .from(TABLE)
    .insert({
      ...content,
      user_id: auth.user.id,
      song_id: d.songId,
      status: dbStatusFromSendState(d.sendState),
      sent_date: d.sendState === "sent" ? new Date().toISOString().slice(0, 10) : null,
    })
    .select(COLUMNS)
    .single();

  if (!insertError) {
    return NextResponse.json({ pitch: toPitch(inserted as PitchRow), persisted: true }, { status: 201 });
  }

  if (isMissingStorage(insertError)) return storageNotReady();

  // Unique (user_id, song_id, playlist_name) — refresh content only, and
  // leave status / sent_date exactly as they are.
  if (insertError.code === "23505") {
    const { data: updated, error: updateError } = await auth.admin
      .from(TABLE)
      .update(content)
      .eq("user_id", auth.user.id)
      .eq("song_id", d.songId)
      .eq("playlist_name", d.playlistName)
      .select(COLUMNS);

    if (updateError) {
      if (isMissingStorage(updateError)) return storageNotReady();
      console.error("[pitches] POST update error:", updateError.message);
      return NextResponse.json({ error: "Could not save pitch" }, { status: 500 });
    }

    const row = (updated as PitchRow[] | null)?.[0];
    if (!row) return NextResponse.json({ error: "Pitch not found" }, { status: 404 });
    return NextResponse.json({ pitch: toPitch(row), persisted: true });
  }

  console.error("[pitches] POST error:", insertError.message);
  return NextResponse.json({ error: "Could not save pitch" }, { status: 500 });
}

/**
 * PATCH /api/v1/pitches — edit pitch text, or move the send state forward
 * (draft → opened-in-mail → sent). Backwards moves are rejected: a pitch
 * that was marked sent can never silently become a draft again.
 */
export async function PATCH(req: NextRequest) {
  const limited = rateLimited(req, "write", 30);
  if (limited) return limited;

  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { id, subject, body: pitchBody, sendState: nextState, trackingStatus } = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (subject !== undefined) patch.pitch_subject = subject;
  if (pitchBody !== undefined) patch.pitch_body = pitchBody;

  if (nextState !== undefined || trackingStatus !== undefined) {
    const { data: current, error: readError } = await auth.admin
      .from(TABLE)
      .select("status, sent_date")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (readError) {
      if (isMissingStorage(readError)) return storageNotReady();
      console.error("[pitches] PATCH read error:", readError.message);
      return NextResponse.json({ error: "Could not update pitch" }, { status: 500 });
    }
    if (!current) return NextResponse.json({ error: "Pitch not found" }, { status: 404 });

    const currentStatus = (current as { status: PitchDbStatus }).status;
    const targetStatus = trackingStatus ?? dbStatusFromSendState(nextState as PitchSendState);
    if (!canTransitionSendState(currentStatus, targetStatus)) {
      return NextResponse.json(
        { error: `A pitch that is "${currentStatus}" cannot become "${targetStatus}"` },
        { status: 409 },
      );
    }
    patch.status = targetStatus;
    if (targetStatus === "sent" && !(current as { sent_date: string | null }).sent_date) {
      patch.sent_date = new Date().toISOString().slice(0, 10);
    }
  }

  const { data, error } = await auth.admin
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select(COLUMNS);

  if (error) {
    if (isMissingStorage(error)) return storageNotReady();
    console.error("[pitches] PATCH error:", error.message);
    return NextResponse.json({ error: "Could not update pitch" }, { status: 500 });
  }

  const row = (data as PitchRow[] | null)?.[0];
  if (!row) return NextResponse.json({ error: "Pitch not found" }, { status: 404 });

  return NextResponse.json({ pitch: toPitch(row), persisted: true });
}
