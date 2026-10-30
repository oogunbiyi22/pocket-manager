/**
 * Beat licenses endpoint — persists the Beat Licensing Manager's logged
 * licenses to Supabase (until PATCH 004, /beats kept them in useState only
 * and they died on refresh).
 *
 * Storage: one row per license in the `beat_licenses` table
 * (see supabase/PATCH_004_beat_licenses.sql — also folded into
 * supabase/MASTER_RUNME.sql). RLS restricts rows to their owner; this route
 * additionally scopes every query to the authenticated user.
 *
 * Auth: Bearer token from Supabase session (same pattern as /api/v1/pitches)
 * Rate limit: reads use RATE_LIMITS.api, writes 30 per minute
 *
 * Graceful pre-migration behavior: until the owner runs the SQL, the table
 * doesn't exist. GET then returns 200 with `persisted: false` and an empty
 * list so the page falls back to its old in-memory behavior instead of
 * crashing; writes return 503 with `persisted: false`.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const TABLE = "beat_licenses";

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

// Validate Bearer token header
function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

function rateLimited(req: NextRequest, scope: string, limit: number) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`beats:${scope}:${ip}`, limit, RATE_LIMITS.api.windowMs);
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
// PGRST205 (not in schema cache), depending on version.
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return Boolean(error.message?.includes(TABLE) && /does not exist|schema cache/i.test(error.message));
}

type LicenseRow = {
  id: string;
  song_id: string;
  buyer: string;
  license_type: "lease" | "exclusive";
  amount: number | string;
  license_date: string;
  expires: string | null;
};

function toLicense(row: LicenseRow) {
  return {
    id: row.id,
    songId: row.song_id,
    buyer: row.buyer,
    type: row.license_type,
    amount: Number(row.amount) || 0,
    date: row.license_date,
    expires: row.expires ?? "",
  };
}

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

const CreateSchema = z.object({
  songId: z.string().min(1).max(200),
  buyer: z.string().trim().min(1).max(200),
  type: z.enum(["lease", "exclusive"]),
  amount: z.number().finite().min(0).max(10_000_000),
  date: dateString,
  expires: z.union([dateString, z.literal("")]).optional().default(""),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  songId: z.string().min(1).max(200).optional(),
  buyer: z.string().trim().min(1).max(200).optional(),
  type: z.enum(["lease", "exclusive"]).optional(),
  amount: z.number().finite().min(0).max(10_000_000).optional(),
  date: dateString.optional(),
  expires: z.union([dateString, z.literal("")]).optional(),
}).refine(
  (value) => Object.keys(value).length > 1,
  { message: "Nothing to update" },
);

/** GET /api/v1/beats — list the signed-in user's licenses, newest first */
export async function GET(req: NextRequest) {
  const limited = rateLimited(req, "read", RATE_LIMITS.api.limit);
  if (limited) return limited;

  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const { data, error } = await auth.admin
    .from(TABLE)
    .select("id, song_id, buyer, license_type, amount, license_date, expires")
    .eq("user_id", auth.user.id)
    .order("license_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTable(error)) {
      // Pre-migration: page falls back to in-memory mode.
      return NextResponse.json({ licenses: [], persisted: false });
    }
    console.error("[beats] GET error:", error.message);
    return NextResponse.json({ error: "Could not load licenses" }, { status: 500 });
  }

  return NextResponse.json({
    licenses: ((data ?? []) as LicenseRow[]).map(toLicense),
    persisted: true,
  });
}

/** POST /api/v1/beats — log a new license for the signed-in user */
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

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.admin
    .from(TABLE)
    .insert({
      user_id: auth.user.id,
      song_id: parsed.data.songId,
      buyer: parsed.data.buyer,
      license_type: parsed.data.type,
      amount: parsed.data.amount,
      license_date: parsed.data.date,
      expires: parsed.data.expires || null,
    })
    .select("id, song_id, buyer, license_type, amount, license_date, expires")
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: "Beat licensing storage is not set up yet", persisted: false },
        { status: 503 },
      );
    }
    console.error("[beats] POST error:", error.message);
    return NextResponse.json({ error: "Could not save license" }, { status: 500 });
  }

  return NextResponse.json({ license: toLicense(data as LicenseRow), persisted: true }, { status: 201 });
}

/** PATCH /api/v1/beats — update one of the signed-in user's licenses */
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

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { id, songId, buyer, type, amount, date, expires } = parsed.data;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (songId !== undefined) patch.song_id = songId;
  if (buyer !== undefined) patch.buyer = buyer;
  if (type !== undefined) patch.license_type = type;
  if (amount !== undefined) patch.amount = amount;
  if (date !== undefined) patch.license_date = date;
  if (expires !== undefined) patch.expires = expires || null;

  const { data, error } = await auth.admin
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id, song_id, buyer, license_type, amount, license_date, expires");

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: "Beat licensing storage is not set up yet", persisted: false },
        { status: 503 },
      );
    }
    console.error("[beats] PATCH error:", error.message);
    return NextResponse.json({ error: "Could not update license" }, { status: 500 });
  }

  const row = (data as LicenseRow[] | null)?.[0];
  if (!row) return NextResponse.json({ error: "License not found" }, { status: 404 });

  return NextResponse.json({ license: toLicense(row), persisted: true });
}

/** DELETE /api/v1/beats?id=<uuid> — delete one of the signed-in user's licenses */
export async function DELETE(req: NextRequest) {
  const limited = rateLimited(req, "write", 30);
  if (limited) return limited;

  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const id = req.nextUrl.searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "A valid license id is required" }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("id");

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: "Beat licensing storage is not set up yet", persisted: false },
        { status: 503 },
      );
    }
    console.error("[beats] DELETE error:", error.message);
    return NextResponse.json({ error: "Could not delete license" }, { status: 500 });
  }

  if (!data?.length) return NextResponse.json({ error: "License not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
