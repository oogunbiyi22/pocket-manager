/**
 * In-memory rate limiter with sliding window.
 * Works per-instance in serverless (Vercel warm instances).
 * For production scale, replace the store with Upstash Redis.
 */

type Window = {
  count: number;
  resetAt: number;
};

// Module-level store survives across requests within a warm Lambda instance
const store = new Map<string, Window>();

// Prune expired entries every ~100 requests to prevent memory leak
let callCount = 0;
function maybePrune() {
  if (++callCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; message: string };

/**
 * Check rate limit for a given key (e.g., IP + route).
 * @param key       Unique identifier (IP + route slug)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  maybePrune();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    // Fresh window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      ok: false,
      retryAfterSeconds,
      message: `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`,
    };
  }

  existing.count++;
  return { ok: true };
}

/**
 * Get client IP from Next.js request headers.
 * Handles Vercel's x-forwarded-for and x-real-ip headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}

/** Pre-configured rate limit profiles */
export const RATE_LIMITS = {
  // Auth routes — strictest (5 attempts per 15 min)
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },
  // AI chat (10 requests per minute per IP)
  chat: { limit: 10, windowMs: 60 * 1000 },
  // Billing (3 checkout attempts per minute)
  billing: { limit: 3, windowMs: 60 * 1000 },
  // Waitlist (2 per minute)
  waitlist: { limit: 2, windowMs: 60 * 1000 },
  // General API (60 per minute)
  api: { limit: 60, windowMs: 60 * 1000 },
} as const;
