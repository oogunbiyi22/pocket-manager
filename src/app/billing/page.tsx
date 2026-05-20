"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: "",
    tagline: "Get started",
    features: [
      "Gap range estimates",
      "Up to 3 songs",
      "Top 1 priority action",
      "Basic readiness score",
    ],
    cta: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    interval: "/mo",
    tagline: "For working artists",
    features: [
      "Exact gap dollar amounts",
      "Unlimited songs",
      "Full prioritized action queue",
      "Signal + Harvest exports",
      "A — AI manager chat",
      "Release Radar milestone tracking",
      "Split sheet generation",
    ],
    cta: "Start free trial",
    trialNote: "7 days free · no card needed",
  },
  {
    id: "elite",
    name: "Elite",
    price: "$29",
    interval: "/mo",
    tagline: "For serious catalogues",
    features: [
      "Everything in Pro",
      "Contract scanner",
      "Catalog valuation report",
      "Sync brief matching",
      "Priority A responses",
      "White-label EPK",
    ],
    cta: "Upgrade to Elite",
  },
];

export default function BillingPage() {
  const { profile, updateProfile } = usePocket();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgraded, setUpgraded] = useState<string | null>(null);
  const [trialStarted, setTrialStarted] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const up = p.get("upgraded");
    const trial = p.get("trial");
    setUpgraded(up);
    setTrialStarted(trial === "started");
    if (up && profile.plan !== up) {
      updateProfile({ plan: up as "pro" | "elite" });
    }
  }, []);

  const currentPlan = PLANS.find((p) => p.id === profile.plan) ?? PLANS[0];

  async function startCheckout(planId: string) {
    setCheckingOut(planId);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          email: profile.email ?? undefined,
          successUrl: `${window.location.origin}/billing?upgraded=${planId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/billing`,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Billing unavailable. Try again."); return; }
      if (data.url) { window.location.href = data.url; return; }
      setError("Could not create billing session.");
    } catch {
      setError("Billing unavailable. Try again.");
    } finally {
      setCheckingOut(null);
    }
  }

  async function openPortal() {
    if (!profile.stripeCustomerId) {
      setError("No active billing account found.");
      return;
    }
    setOpeningPortal(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: profile.stripeCustomerId,
          returnUrl: `${window.location.origin}/billing`,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Portal unavailable."); return; }
      if (data.url) { window.location.href = data.url; return; }
      setError("Could not open billing portal.");
    } catch {
      setError("Portal unavailable. Try again.");
    } finally {
      setOpeningPortal(false);
    }
  }

  return (
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-3xl space-y-5">

        <header className="px-1 pt-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Billing</div>
          <div className="text-[15px] text-white/90">Subscription & plan</div>
        </header>

        {/* Current plan banner */}
        <section className="rounded-[20px] glass-dark card-shadow-dark px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-1">Current plan</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-light text-white">{currentPlan.name}</span>
                <span className="rounded-full bg-[#97c459]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#97c459]">Active</span>
              </div>
              <div className="mt-1 text-[13px] text-white/50">{currentPlan.price}{currentPlan.interval} · {currentPlan.tagline}</div>
            </div>
            {profile.stripeCustomerId ? (
              <button
                type="button"
                onClick={openPortal}
                disabled={openingPortal}
                className="rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-[13px] text-white/80 transition hover:bg-white/12 disabled:opacity-50"
              >
                {openingPortal ? "Opening…" : "Manage billing"}
              </button>
            ) : null}
          </div>

          {trialStarted && (
            <div className="mt-4 rounded-xl border border-[#5fcf7e]/25 bg-[#5fcf7e]/10 px-4 py-3 text-[13px] text-[#5fcf7e]">
              Pro trial active — full access unlocked for 7 days.
            </div>
          )}
          {upgraded && (
            <div className="mt-4 rounded-xl border border-[#97c459]/25 bg-[#97c459]/10 px-4 py-3 text-[13px] text-[#97c459]">
              You're on {upgraded.charAt(0).toUpperCase() + upgraded.slice(1)}. All features unlocked.
            </div>
          )}
        </section>

        {/* Plan cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isActive = profile.plan === plan.id;
            const isDowngrade = (plan.id === "free" && profile.plan !== "free") ||
              (plan.id === "pro" && profile.plan === "elite");

            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[20px] overflow-hidden ${
                  isActive
                    ? "ring-1 ring-[#97c459]/60 glass-dark card-shadow-dark"
                    : "glass card-shadow"
                }`}
              >
                <div className="flex-1 px-5 py-5">
                  {isActive && (
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#97c459]">
                      Current plan
                    </div>
                  )}
                  {plan.id === "pro" && !isActive && (
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#ef9f27]">
                      Most popular
                    </div>
                  )}
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">{plan.name}</div>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-[30px] font-light leading-none text-white">{plan.price}</span>
                    {plan.interval && <span className="text-sm text-white/40">{plan.interval}</span>}
                  </div>
                  <div className="mt-1 text-[12px] text-white/40">{plan.tagline}</div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[12px] text-white/65">
                        <span className="mt-0.5 shrink-0 text-[#97c459]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.cta && !isActive && !isDowngrade && (
                  <div className="border-t border-white/8 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => startCheckout(plan.id)}
                      disabled={checkingOut === plan.id}
                      className={`w-full rounded-xl py-2.5 text-[13px] font-medium transition disabled:opacity-50 ${
                        plan.id === "pro"
                          ? "bg-white text-[#0d0d0b] hover:bg-white/90"
                          : "border border-white/20 bg-white/8 text-white hover:bg-white/12"
                      }`}
                    >
                      {checkingOut === plan.id ? "Opening…" : plan.cta}
                    </button>
                    {"trialNote" in plan && plan.trialNote ? (
                      <div className="mt-2 text-center text-[11px] text-white/35">{plan.trialNote}</div>
                    ) : null}
                  </div>
                )}

                {isActive && plan.id !== "free" && (
                  <div className="border-t border-white/8 px-5 py-4">
                    <button
                      type="button"
                      onClick={openPortal}
                      disabled={openingPortal}
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-[13px] text-white/60 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {openingPortal ? "Opening…" : "Manage or cancel"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-[#e24b4a]/20 bg-[#e24b4a]/10 px-4 py-3 text-[13px] text-[#f5b3b3]">
            {error}
          </div>
        )}

        <p className="px-1 text-[11px] text-white/35">
          Cancel anytime from the billing portal. Paid plans renew monthly. No hidden fees.
        </p>

      </main>
    </AppShell>
  );
}
