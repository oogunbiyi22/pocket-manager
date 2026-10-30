/**
 * Plan tiers and the gating rules that depend on them.
 *
 * Single source of truth for "what does this plan unlock" so the UI
 * (Action Queue) and the server (chat model rail) can never drift apart.
 *
 * Trust rule: a plan is only ever read from the user's stored profile
 * (written by the Stripe webhook). Anything a client claims about its
 * own plan is ignored — see `resolveServerPlan`.
 */

export type PlanTier = "free" | "pro" | "elite";

export function normalizePlan(value: unknown): PlanTier {
  return value === "pro" || value === "elite" ? value : "free";
}

export function isPaidPlan(plan: PlanTier): boolean {
  return plan !== "free";
}

/**
 * Action Queue gating: Free sees only the top action; Pro and Elite
 * see the full queue. (Previously every user — paying included — was
 * locked past the first action because the plan was never checked.)
 */
export function isActionLocked(plan: PlanTier, index: number): boolean {
  return !isPaidPlan(plan) && index > 0;
}

/**
 * The only plan a server route may act on: the authenticated user's
 * stored profile plan. No session → free, whatever the request body
 * claims. A stored value that isn't a known tier → free.
 */
export function resolveServerPlan(
  authenticatedUserId: string | null,
  profilePlan: unknown,
): PlanTier {
  if (!authenticatedUserId) return "free";
  return normalizePlan(profilePlan);
}
