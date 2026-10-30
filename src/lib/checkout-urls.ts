/**
 * Checkout redirect URL guard.
 *
 * The billing checkout route accepts optional client-supplied
 * successUrl/cancelUrl. Those used to be passed to Stripe verbatim (only
 * validated as URLs), so any caller could send users to an arbitrary
 * origin after checkout — an open-redirect via a trusted Stripe page.
 *
 * Rule: a client-supplied redirect is honored only when its origin is one
 * of the app's own origins. Anything else falls back to the server default.
 */

export const APP_ORIGINS = [
  "https://pocketmanager.online",
  "https://pocketmanager.vercel.app",
  "http://localhost:3000",
] as const;

export function isAppOrigin(origin: string): boolean {
  return (APP_ORIGINS as readonly string[]).includes(origin);
}

/**
 * Returns `candidate` when it is an absolute URL on one of the app's own
 * origins; otherwise returns `fallback`.
 */
export function resolveAppRedirectUrl(candidate: string | undefined | null, fallback: string): string {
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    if (!isAppOrigin(url.origin)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

/** Origin to build default redirect URLs from, given the request's Origin header. */
export function resolveAppOrigin(requestOrigin: string | null | undefined): string {
  if (requestOrigin && isAppOrigin(requestOrigin)) return requestOrigin;
  return APP_ORIGINS[0];
}
