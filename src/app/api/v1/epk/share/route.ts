/**
 * EPK share settings endpoint — backs the public EPK link
 * (/epk/share/[token]).
 *
 * The token lives on the artist's `profiles` row (PATCH 005), alongside the
 * bio/contact shown on the public page. Whoever holds the link can view the
 * EPK read-only; the artist can regenerate the token (old link dies) or
 * revoke it (no public page at all) from the EPK builder.
 *
 * Auth: Bearer token from Supabase session (same pattern as /api/v1/beats).
 * The token itself is only ever returned to its owner through this route.
 *
 * Graceful pre-migration behavior: until PATCH 005 runs, the columns don't
 * exist — GET returns 200 with `persisted: false` and no token, writes
 * return 503, and the EPK page simply keeps its old (unshared) behavior.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

const TABLE = "profiles";
const COLUMNS = "epk_share_token, epk_bio, epk_contact";

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
  const rl = checkRateLimit(`epk-share:${scope}:${ip}`, limit, RATE_LIMITS.api.windowMs);
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

// A missing PATCH 005 column surfaces as 42703 (undefined column) or
// PGRST204; a missing table as 42P01 / PGRST205.
function isMissingStorage(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (["42P01", "PGRST205", "42703", "PGRST204"].includes(error.code ?? "")) return true;
  return Boolean(
    error.message &&
      /does not exist|schema cache|could not find/i.test(error.message) &&
      /profiles|epk_/i.test(error.message),
  );
}

function storageNotReady() {
  return NextResponse.json(
    { error: "EPK sharing is not set up yet", persisted: false },
    { status: 503 },
  );
}

type ShareRow = {
  epk_share_token: string | null;
  epk_bio: string | null;
  epk_contact: string | null;
};

function toShare(row: ShareRow | null) {
  return {
    token: row?.epk_share_token ?? null,
    bio: row?.epk_bio ?? "",
    contact: row?.epk_contact ?? "",
    persisted: true as const,
  };
}

function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}

const PostSchema = z.object({
  regenerate: z.boolean().optional(),
  bio: z.string().max(2000).optional(),
  contact: z.string().max(300).optional(),
}).refine(
  (value) => value.regenerate === true || value.bio !== undefined || value.contact !== undefined,
  { message: "Nothing to update" },
);

/** GET /api/v1/epk/share — the artist's own share settings (never anyone else's) */
export async function GET(req: NextRequest) {
  const limited = rateLimited(req, "read", RATE_LIMITS.api.limit);
  if (limited) return limited;

  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const { data, error } = await auth.admin
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    if (isMissingStorage(error)) {
      return NextResponse.json({ token: null, bio: "", contact: "", persisted: false });
    }
    console.error("[epk/share] GET error:", error.message);
    return NextResponse.json({ error: "Could not load share settings" }, { status: 500 });
  }

  return NextResponse.json(toShare(data as ShareRow | null));
}

/**
 * POST /api/v1/epk/share — save bio/contact, and/or (re)generate the token.
 * Regenerating invalidates the previous link immediately.
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

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.bio !== undefined) patch.epk_bio = parsed.data.bio;
  if (parsed.data.contact !== undefined) patch.epk_contact = parsed.data.contact;
  if (parsed.data.regenerate) patch.epk_share_token = newShareToken();

  const { data, error } = await auth.admin
    .from(TABLE)
    .update(patch)
    .eq("id", auth.user.id)
    .select(COLUMNS);

  if (error) {
    if (isMissingStorage(error)) return storageNotReady();
    console.error("[epk/share] POST error:", error.message);
    return NextResponse.json({ error: "Could not save share settings" }, { status: 500 });
  }

  const row = (data as ShareRow[] | null)?.[0];
  if (!row) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(toShare(row));
}

/** DELETE /api/v1/epk/share — revoke the public link (token cleared) */
export async function DELETE(req: NextRequest) {
  const limited = rateLimited(req, "write", 30);
  if (limited) return limited;

  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const { data, error } = await auth.admin
    .from(TABLE)
    .update({ epk_share_token: null, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id)
    .select(COLUMNS);

  if (error) {
    if (isMissingStorage(error)) return storageNotReady();
    console.error("[epk/share] DELETE error:", error.message);
    return NextResponse.json({ error: "Could not revoke share link" }, { status: 500 });
  }

  const row = (data as ShareRow[] | null)?.[0];
  if (!row) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(toShare(row));
}
