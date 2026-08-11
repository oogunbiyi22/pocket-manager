"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getSupabase } from "@/lib/supabase";

type BillingInterval = "monthly" | "annual";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    tagline: "Start tracking your catalog",
    features: [
      { text: "Up to 3 songs", included: true },
      { text: "Gap range estimates", included: true },
      { text: "Basic readiness score", included: true },
      { text: "1 priority action per song", included: true },
      { text: "Unlimited songs", included: false },
      { text: "AI manager chat", included: false },
      { text: "Signal + Harvest exports", included: false },
    ],
    cta: null,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 9,
    annual: 7,
    tagline: "For artists building momentum",
    features: [
      { text: "Unlimited songs", included: true },
      { text: "Exact gap dollar amounts", included: true },
      { text: "Full prioritized action queue", included: true },
      { text: "A — AI manager chat", included: true },
      { text: "Signal + Harvest exports", included: true },
      { text: "Release Radar milestones", included: true },
      { text: "Split sheet generation", included: true },
    ],
    cta: "Start 7-day free trial",
    trialNote: "No card needed during trial",
    badge: "Most popular",
  },
  {
    id: "elite",
    name: "Elite",
    monthly: 29,
    annual: 23,
    tagline: "For artists with a serious catalog",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Contract scanner + analysis", included: true },
      { text: "Catalog valuation report", included: true },
      { text: "Sync brief matching", included: true },
      { text: "Priority AI responses", included: true },
      { text: "White-label EPK", included: true },
    ],
    cta: "Upgrade to Elite",
    badge: null,
  },
];

export default function BillingPage() {
  const { profile, updateProfile } = usePocket();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
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
      const supabase = getSupabase();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;

      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan: planId,
          interval,
          successUrl: `${window.location.origin}/billing?upgraded=${planId}`,
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
    if (!profile.stripeCustomerId) { setError("No active billing account found."); return; }
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
      <main className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <header className="px-1 pt-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Billing</div>
          <div className="text-[22px] font-light text-white/90 mt-0.5">Choose your plan</div>
        </header>

        {/* Success banners */}
        {(trialStarted || upgraded) && (
          <div className="rounded-[16px] border border-[#97c459]/25 bg-[#97c459]/10 px-5 py-3 text-[13px] text-[#97c459]">
            {trialStarted
              ? "Pro trial active — full access unlocked for 7 days."
              : `You're on ${upgraded?.charAt(0).toUpperCase()}${upgraded?.slice(1)}. All features unlocked.`}
          </div>
        )}

        {/* Current plan strip */}
        <div className="flex items-center justify-between rounded-[16px] glass px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-[#97c459]" />
            <span className="text-[13px] text-white/70">
              Current plan: <span className="text-white font-medium">{currentPlan.name}</span>
            </span>
          </div>
          {profile.stripeCustomerId && (
            <button
              type="button"
              onClick={openPortal}
              disabled={openingPortal}
              className="text-[12px] text-white/50 hover:text-white/80 transition disabled:opacity-40"
            >
              {openingPortal ? "Opening…" : "Manage billing →"}
            </button>
          )}
        </div>

        {/* Interval toggle */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition ${
                interval === "monthly" ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("annual")}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-medium transition ${
                interval === "annual" ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"
              }`}
            >
              Annual
              <span className="rounded-full bg-[#97c459]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#97c459]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isActive = profile.plan === plan.id;
            const price = interval === "annual" ? plan.annual : plan.monthly;
            const isDowngrade = (plan.id === "free" && profile.plan !== "free") ||
              (plan.id === "pro" && profile.plan === "elite");

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-[20px] overflow-hidden ${
                  plan.id === "pro"
                    ? "glass-dark card-shadow-dark ring-1 ring-white/10"
                    : "glass card-shadow"
                } ${isActive ? "ring-1 ring-[#97c459]/50" : ""}`}
              >
                {plan.badge && !isActive && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <span className="rounded-b-full bg-[#ef9f27] px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center">
                    <span className="rounded-b-full bg-[#97c459] px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                      Your plan
                    </span>
                  </div>
                )}

                <div className="flex-1 px-5 pt-8 pb-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{plan.name}</div>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-[38px] font-light leading-none text-white">
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className="mb-1.5 text-[13px] text-white/40">/mo</span>
                    )}
                  </div>
                  {interval === "annual" && price > 0 && (
                    <div className="mt-0.5 text-[11px] text-white/40">
                      Billed ${price * 12}/yr
                    </div>
                  )}
                  <div className="mt-2 text-[12px] text-white/50 leading-relaxed">{plan.tagline}</div>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.text} className={`flex items-start gap-2 text-[12px] ${f.included ? "text-white/75" : "text-white/25 line-through"}`}>
                        <span className={`mt-0.5 shrink-0 text-[11px] font-bold ${f.included ? "text-[#97c459]" : "text-white/20"}`}>
                          {f.included ? "✓" : "×"}
                        </span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="px-5 pb-5">
                  {plan.cta && !isActive && !isDowngrade ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => startCheckout(plan.id)}
                        disabled={checkingOut === plan.id}
                        className={`w-full rounded-xl py-3 text-[13px] font-semibold transition disabled:opacity-50 ${
                          plan.id === "pro"
                            ? "bg-white text-[#0d0d0b] hover:bg-white/90"
                            : "border border-white/20 bg-white/8 text-white hover:bg-white/12"
                        }`}
                      >
                        {checkingOut === plan.id ? "Opening…" : plan.cta}
                      </button>
                      {"trialNote" in plan && plan.trialNote && (
                        <div className="mt-2 text-center text-[11px] text-white/30">{plan.trialNote}</div>
                      )}
                    </div>
                  ) : isActive ? (
                    plan.id !== "free" ? (
                      <button
                        type="button"
                        onClick={openPortal}
                        disabled={openingPortal}
                        className="w-full rounded-xl border border-white/12 bg-white/5 py-2.5 text-[12px] text-white/50 transition hover:bg-white/10 disabled:opacity-40"
                      >
                        {openingPortal ? "Opening…" : "Manage or cancel"}
                      </button>
                    ) : (
                      <div className="rounded-xl border border-[#97c459]/20 bg-[#97c459]/8 py-2.5 text-center text-[12px] text-[#97c459]">
                        Active plan
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-[#e24b4a]/20 bg-[#e24b4a]/10 px-4 py-3 text-[13px] text-[#f5b3b3]">
            {error}
          </div>
        )}

        {/* Footer note */}
        <div className="flex flex-col items-center gap-1 pb-4 text-center">
          <p className="text-[11px] text-white/30">Cancel anytime · No hidden fees · Annual plans billed upfront</p>
        </div>

      </main>
    </AppShell>
  );
}
