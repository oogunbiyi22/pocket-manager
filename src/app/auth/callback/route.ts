/**
 * OAuth callback handler
 * ──────────────────────
 * Google (and any Supabase OAuth provider) returns a `?code=` parameter
 * after the user approves. This route exchanges that code for a real session,
 * then redirects the user to their intended destination.
 *
 * Without this route, the OAuth code is never exchanged and the user
 * ends up unauthenticated even after approving Google sign-in.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // `next` lets us send the user back to where they were (e.g. /home, /onboarding)
  const next = searchParams.get("next") ?? "/home";

  if (!code) {
    // No code — redirect to sign-in with an error hint
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/sign-in?error=not_configured`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  // Session is now set — redirect to the intended page
  // Use absolute URL to ensure the redirect works in all environments
  const redirectUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/home`;
  return NextResponse.redirect(redirectUrl);
}
