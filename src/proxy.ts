import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 Proxy — runs on every matched request before the route handler.
 * (Next.js 16 renamed middleware → proxy; Node.js runtime only)
 *
 * Responsibilities:
 * 1. Security headers on every response
 * 2. Auth guard — redirect unauthenticated users from protected routes
 *    (lightweight gate based on presence of the Supabase session cookie)
 */

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/work", "/harvest", "/signal", "/profile", "/settings", "/projects",
  "/platforms", "/notifications", "/studio", "/epk", "/guild", "/vault",
  "/radar", "/albums", "/beats", "/contracts", "/statements", "/financial",
  "/forecast", "/valuation", "/actions", "/capture", "/drop", "/pitch-kits",
  "/sync", "/pitching", "/career-twin", "/booking", "/events", "/venues",
  "/radio", "/home", "/mobile", "/pocket", "/a", "/publishing",
];

// Public routes — never require auth
const PUBLIC_PREFIXES = ["/sign-in", "/onboarding", "/terms", "/privacy", "/api", "/auth", "/status"];

function isProtected(pathname: string): boolean {
  if (pathname === "/") return false;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.groq.com https://api.anthropic.com https://api.openai.com https://itunes.apple.com",
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

  if (isProtected(pathname)) {
    const cookies = request.cookies;
    // Supabase SSR sets cookies named: sb-<project-ref>-auth-token
    // For large JWTs it chunks them: sb-<ref>-auth-token.0, sb-<ref>-auth-token.1, etc.
    // Accept any of these patterns so chunked tokens don't cause false logouts.
    const hasSession = [...cookies.getAll()].some((c) => {
      if (!c.name.startsWith("sb-")) return false;
      return c.name.endsWith("-auth-token") || c.name.includes("-auth-token.");
    });

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect", pathname);
      const redirect = NextResponse.redirect(url);
      return addSecurityHeaders(redirect);
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-|manifest).*)",
  ],
};
