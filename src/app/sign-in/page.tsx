"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { getSupabase } from "@/lib/supabase";
import { LogoWordmark } from "@/components/logo";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/home";
  const defaultMode = searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "forgot">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabase();
    if (!supabase) {
      setError("Auth not configured. Add Supabase env vars to Vercel and redeploy.");
      setLoading(false);
      return;
    }

    if (mode === "forgot") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/sign-in`,
      });
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
      return;
    }

    if (mode === "sign-up") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding` },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo.startsWith("/") ? redirectTo : "/home");
  }

  async function socialAuth(provider: "google") {
    setLoading(true);
    setError("");
    const supabase = getSupabase();
    if (!supabase) {
      setError("Auth not configured.");
      setLoading(false);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/mobile` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  if (sent) {
    const isForgot = mode === "forgot";
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md overflow-hidden rounded-[28px] glass card-shadow p-8 text-center">
          <div className="text-3xl">{isForgot ? "🔑" : "✉️"}</div>
          <h2 className="mt-4 text-xl font-medium text-[#111]">Check your email</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b6b65]">
            {isForgot
              ? <>We sent a password reset link to <strong>{email}</strong>.</>
              : <>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</>
            }
          </p>
          <button
            type="button"
            onClick={() => { setSent(false); setMode("sign-in"); }}
            className="mt-6 text-sm text-[#111] underline underline-offset-2"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const isForgot = mode === "forgot";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <LogoWordmark size={36} />
        </div>

        <div className="overflow-hidden rounded-[28px] glass card-shadow text-[var(--text-primary)]">
          {/* Header */}
          <div className="bg-[#0d0d0b] px-6 py-6 text-white">
            <h1 className="text-2xl font-light tracking-tight">
              {mode === "sign-in" ? "Welcome back." : mode === "sign-up" ? "Start collecting." : "Reset password."}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              {mode === "sign-in"
                ? "Sign in to your Pocket Manager account."
                : mode === "sign-up"
                ? "Create your account and see your first gap today."
                : "Enter your email and we'll send a reset link."}
            </p>
          </div>

          <div className="p-6">
            {/* Google auth — only on sign-in / sign-up */}
            {!isForgot && (
              <>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => socialAuth("google")}
                    disabled={loading}
                    className="flex h-11 items-center justify-center gap-2.5 rounded-xl border-[0.5px] border-black/15 bg-white text-sm font-medium text-[#111] transition hover:bg-[#f4f1eb] disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="size-4">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-black/10" />
                  <span className="text-xs text-[#9a9a8a]">or</span>
                  <div className="h-px flex-1 bg-black/10" />
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={submit} className="grid gap-3">
              <label className="block text-sm text-[#514d47]">
                <span className="mb-1.5 block">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
                />
              </label>

              {!isForgot && (
                <label className="block text-sm text-[#514d47]">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span>Password</span>
                    {mode === "sign-in" && (
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(""); }}
                        className="text-xs text-[#9a9a8a] hover:text-[#111] transition"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
                  />
                </label>
              )}

              {error && (
                <p className="rounded-lg bg-[#fcebeb] px-3 py-2 text-[13px] text-[#a32d2d]">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || (!isForgot && !password.trim())}
                className="mt-1 h-11 rounded-xl bg-[#0a0a0a] text-sm font-medium text-white transition hover:bg-black disabled:opacity-40"
              >
                {loading
                  ? "One sec…"
                  : mode === "sign-in"
                  ? "Sign in"
                  : mode === "sign-up"
                  ? "Create account"
                  : "Send reset link"}
              </button>
            </form>

            {/* Mode toggle */}
            <div className="mt-5 text-center text-sm text-[#6b6b65]">
              {mode === "sign-in" ? (
                <>
                  No account?{" "}
                  <button type="button" onClick={() => { setMode("sign-up"); setError(""); }}
                    className="font-medium text-[#111] underline-offset-2 hover:underline">
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  {mode === "forgot" ? "Remember it? " : "Already have an account? "}
                  <button type="button" onClick={() => { setMode("sign-in"); setError(""); }}
                    className="font-medium text-[#111] underline-offset-2 hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#9a9a8a]">
          By continuing, you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="size-6 rounded-full border-2 border-black/20 border-t-black/60 animate-spin" /></div>}>
      <SignInContent />
    </Suspense>
  );
}
