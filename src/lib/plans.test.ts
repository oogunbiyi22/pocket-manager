import { describe, it, expect } from "vitest";
import {
  normalizePlan,
  isPaidPlan,
  isActionLocked,
  resolveServerPlan,
} from "./plans";

describe("normalizePlan", () => {
  it("passes through known tiers", () => {
    expect(normalizePlan("free")).toBe("free");
    expect(normalizePlan("pro")).toBe("pro");
    expect(normalizePlan("elite")).toBe("elite");
  });

  it("falls back to free for anything else", () => {
    expect(normalizePlan(undefined)).toBe("free");
    expect(normalizePlan(null)).toBe("free");
    expect(normalizePlan("ELITE")).toBe("free");
    expect(normalizePlan("admin")).toBe("free");
    expect(normalizePlan(42)).toBe("free");
  });
});

describe("isPaidPlan", () => {
  it("treats pro and elite as paid", () => {
    expect(isPaidPlan("pro")).toBe(true);
    expect(isPaidPlan("elite")).toBe(true);
    expect(isPaidPlan("free")).toBe(false);
  });
});

describe("isActionLocked — Action Queue gating", () => {
  it("free plan sees only the top action", () => {
    expect(isActionLocked("free", 0)).toBe(false);
    expect(isActionLocked("free", 1)).toBe(true);
    expect(isActionLocked("free", 5)).toBe(true);
  });

  it("paying plans are never locked out of the queue", () => {
    expect(isActionLocked("pro", 0)).toBe(false);
    expect(isActionLocked("pro", 1)).toBe(false);
    expect(isActionLocked("pro", 12)).toBe(false);
    expect(isActionLocked("elite", 1)).toBe(false);
    expect(isActionLocked("elite", 12)).toBe(false);
  });
});

describe("resolveServerPlan — the plan a server route may use", () => {
  it("no session means free, whatever the profile row or client claims", () => {
    expect(resolveServerPlan(null, "elite")).toBe("free");
    expect(resolveServerPlan(null, "pro")).toBe("free");
    expect(resolveServerPlan(null, undefined)).toBe("free");
  });

  it("uses the authenticated user's stored plan", () => {
    expect(resolveServerPlan("user-1", "elite")).toBe("elite");
    expect(resolveServerPlan("user-1", "pro")).toBe("pro");
    expect(resolveServerPlan("user-1", "free")).toBe("free");
  });

  it("unknown stored values fall back to free", () => {
    expect(resolveServerPlan("user-1", undefined)).toBe("free");
    expect(resolveServerPlan("user-1", "enterprise")).toBe("free");
  });
});
