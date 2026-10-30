/**
 * Server-side Supabase clients.
 * These are safe to import in API routes and Server Components only —
 * never import in Client Components (use src/lib/supabase.ts instead).
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/** Admin client — bypasses Row Level Security. Use ONLY in server-side webhooks and trusted admin operations. */
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/** Anon client for server-side use (respects RLS). */
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Bearer-token auth for API routes (the pattern /api/v1/beats and
 * /api/v1/pitches established): resolve the caller's Supabase session
 * token to a user, and hand back the admin client for user-scoped
 * queries. Returns a ready-to-return error response on failure.
 */
export async function requireApiUser(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const anon = getServerSupabase();
  if (!anon) {
    return { response: NextResponse.json({ error: "Service unavailable" }, { status: 503 }) };
  }
  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) {
    return { response: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
  const admin = getAdminSupabase();
  if (!admin) {
    return { response: NextResponse.json({ error: "Service unavailable" }, { status: 503 }) };
  }
  return { user, admin };
}

/** PostgREST codes that mean "this table/column isn't migrated yet". */
export function isMissingTable(
  error: { code?: string; message?: string } | null,
  table: string,
): boolean {
  if (!error) return false;
  if (["42P01", "PGRST205", "42703", "PGRST204"].includes(error.code ?? "")) return true;
  return Boolean(
    error.message &&
      /does not exist|schema cache|could not find/i.test(error.message) &&
      error.message.includes(table),
  );
}
