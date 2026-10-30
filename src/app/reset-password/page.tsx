"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabase, getSupabaseConfigError } from "@/lib/supabase";
import { LogoWordmark } from "@/components/logo";

/**
 * Set-new-password landing for the email reset flow.
 *
 * The reset email points at /auth/callback?next=/reset-password, so by
 * the time we render, the recovery code has been exchanged for a
 * session (PKCE flow) — or the browser client picks the session up
 * from the URL hash (implicit flow, surfaced as PASSWORD_RECOVERY).
 * Either way: no session within a short grace window means the link
 * was invalid or expired, and we say so instead of dead-ending.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("expired");
      setError(getSupabaseConfigError() ?? "Auth is not configured yet.");
      return;
    }

    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("ready");
    };

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      if (result.data.session) markReady();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        markReady();
      }
    });

    // Recovery sessions arrive fast; if nothing shows up shortly, the
    // link is stale — show the expired state rather than spinning.
    timerRef.current = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "checking" ? "expired" : s));
    }, 3000);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError(getSupabaseConfigError() ?? "Auth is not configured yet.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // End the recovery session so the new password is what gets used
    // at sign-in, then send them there with the success hint.
    await supabase.auth.signOut();
    router.push("/sign-in?reset=done");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <LogoWordmark size={36} />
        </div>

        <div className="overflow-hidden rounded-[28px] glass card-shadow text-[var(--text-primary)]">
          <div className="bg-[#0d0d0b] px-6 py-6 text-white">
            <h1 className="text-2xl font-light tracking-tight">Set a new password.</h1>
            <p className="mt-2 text-sm text-white/45">
              {status === "expired"
                ? "That reset link didn't check out."
                : "Choose a new password for your Pocket Manager account."}
            </p>
          </div>

          <div className="p-6">
            {status === "checking" && (
              <p className="py-4 text-center text-sm text-white/50">Verifying your reset link…</p>
            )}

            {status === "expired" && (
              <div className="grid gap-4">
                <p className="rounded-lg bg-[#f05c5c]/10 px-3 py-2 text-[13px] text-[#f05c5c]">
                  {error || "This reset link is invalid or has expired. Request a fresh one and use it right away."}
                </p>
                <Link
                  href="/sign-in"
                  className="flex h-11 items-center justify-center rounded-xl bg-[#0a0a0a] text-sm font-medium text-white transition hover:bg-black"
                >
                  Back to sign in
                </Link>
                <p className="text-center text-[13px] text-white/50">
                  On the sign-in page, use “Forgot password?” to get a new link.
                </p>
              </div>
            )}

            {status === "ready" && (
              <form onSubmit={submit} className="grid gap-3">
                <label className="block text-sm text-white/60">
                  <span className="mb-1.5 block">New password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    autoFocus
                    className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/5 px-4 py-3 text-white/90 outline-none transition focus:border-[#7c6fef]/50"
                  />
                </label>
                <label className="block text-sm text-white/60">
                  <span className="mb-1.5 block">Confirm new password</span>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/5 px-4 py-3 text-white/90 outline-none transition focus:border-[#7c6fef]/50"
                  />
                </label>

                {error && (
                  <p className="rounded-lg bg-[#f05c5c]/10 px-3 py-2 text-[13px] text-[#f05c5c]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password.trim() || !confirm.trim()}
                  className="mt-1 h-11 rounded-xl bg-[#0a0a0a] text-sm font-medium text-white transition hover:bg-black disabled:opacity-40"
                >
                  {loading ? "One sec…" : "Update password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
