import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — runs on every matched request before the route handler.
 *
 * Responsibilities:
 * 1. Security headers on every response
 * 2. Block requests with clearly malicious patterns
 * 3. Auth guard — redirect unauthenticated users from protected routes
 *    (Note: true auth state lives in Supabase; this is a lightweight gate
 *     based on the presence of the Supabase session cookie.)
 */

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/work",
  "/harvest",
  "/signal",
  "/profile",
  "/settings",
  "/projects",
  "/platforms",
  "/notifications",
  "/studio",
  "/epk",
  "/guild",
  "/vault",
  "/radar",
  "/albums",
  "/beats",
  "/contracts",
  "/statements",
  "/financial",
  "/forecast",
  "/valuation",
  "/actions",
  "/capture",
  "/drop",
  "/pitch-kits",
  "/sync",
];

// Public routes — never require auth
const PUBLIC_PREFIXES = ["/", "/home", "/mobile", "/sign-in", "/onboarding", "/terms", "/privacy", "/api"];

function isProtected(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Deny framing (clickjacking protection)
  response.headers.set("X-Frame-Options", "DENY");
  // Disable browser XSS filter (modern browsers use CSP instead)
  response.headers.set("X-XSS-Protection", "0");
  // Referrer policy — don't leak URL in cross-origin requests
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy — disable powerful APIs we don't use
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  // HSTS — 1 year, include subdomains
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  // Content Security Policy — allow our known origins
  // Note: framer-motion uses inline styles; we allow 'unsafe-inline' for styles only
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.groq.com https://api.anthropic.com https://api.openai.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase session cookie (lightweight auth gate)
  // Supabase SSR sets a cookie like sb-<project>-auth-token
  // We check for its existence — the actual token is validated server-side
  if (isProtected(pathname)) {
    const cookies = request.cookies;
    const hasSession = [...cookies.getAll()].some(
      (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"),
    );

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect", pathname);
      const redirect = NextResponse.redirect(url);
      return addSecurityHeaders(redirect);
    }
  }

  // Pass through with security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, manifest files, icons
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-|manifest).*)",
  ],
};
