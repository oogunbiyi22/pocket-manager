/**
 * Server-side Supabase clients.
 * These are safe to import in API routes and Server Components only —
 * never import in Client Components (use src/lib/supabase.ts instead).
 */

import { createClient } from "@supabase/supabase-js";

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
