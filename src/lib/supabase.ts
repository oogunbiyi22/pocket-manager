import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return (
    Boolean(SUPABASE_URL) &&
    SUPABASE_URL !== "undefined" &&
    SUPABASE_URL.startsWith("https://") &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_ANON_KEY !== "undefined" &&
    SUPABASE_ANON_KEY.length > 20
  );
}

/** Returns a human-readable reason why Supabase isn't configured, or null if it is. */
export function getSupabaseConfigError(): string | null {
  if (!SUPABASE_URL || SUPABASE_URL === "undefined") return "NEXT_PUBLIC_SUPABASE_URL is missing";
  if (!SUPABASE_URL.startsWith("https://")) return "NEXT_PUBLIC_SUPABASE_URL must start with https://";
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "undefined") return "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing";
  if (SUPABASE_ANON_KEY.length <= 20) return "NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short — check Vercel env vars";
  return null;
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase env vars not set — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env vars, then redeploy.");
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Singleton for client components — returns null if not configured
let _client: ReturnType<typeof createBrowserClient> | null = null;
export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!_client) {
    try {
      _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch {
      return null;
    }
  }
  return _client;
}
