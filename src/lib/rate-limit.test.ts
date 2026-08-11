import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test:${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it("blocks requests once the limit is hit within the window", () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const third = checkRateLimit(key, 2, 60_000);
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.retryAfterSeconds).toBeGreaterThan(0);
      expect(third.message).toMatch(/rate limit/i);
    }
  });

  it("resets the window after it expires", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 1, 1000);
    expect(checkRateLimit(key, 1, 1000).ok).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(key, 1, 1000).ok).toBe(true);
    vi.useRealTimers();
  });

  it("tracks separate keys independently (per-IP, per-route isolation)", () => {
    const keyA = `a:${Math.random()}`;
    const keyB = `b:${Math.random()}`;
    checkRateLimit(keyA, 1, 60_000);
    // keyA is now exhausted, keyB should be unaffected
    expect(checkRateLimit(keyA, 1, 60_000).ok).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000).ok).toBe(true);
  });
});

describe("getClientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(headers)).toBe("9.9.9.9");
  });

  it("returns 'unknown' when neither header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("RATE_LIMITS profile sanity", () => {
  it("auth is the strictest profile (prevents credential-stuffing/brute force)", () => {
    expect(RATE_LIMITS.auth.limit).toBeLessThanOrEqual(RATE_LIMITS.api.limit);
    expect(RATE_LIMITS.auth.windowMs).toBeGreaterThanOrEqual(RATE_LIMITS.chat.windowMs);
  });

  it("billing has a low request ceiling (checkout should never be spammable)", () => {
    expect(RATE_LIMITS.billing.limit).toBeLessThanOrEqual(5);
  });
});
