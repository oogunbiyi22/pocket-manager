"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: "",
    features: ["Gap range estimates", "3-song starter catalog", "Top 1 next action", "Basic readiness score"],
    cta: null,
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    interval: "/mo",
    features: [
      "Exact Gap dollar estimates",
      "Unlimited songs",
      "Full prioritized action queue",
      "Signal + Harvest exports",
      "A — AI manager chat",
      "Release Radar milestone tracking",
      "Split sheet generation",
    ],
    cta: "Start 7-day trial",
    highlight: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "$29",
    interval: "/mo",
    features: [
      "Everything in Pro",
      "Contract scanner",
      "Catalog valuation report",
      "Sync brief matching",
      "Priority A responses",
      "White-label EPK",
    ],
    cta: "Upgrade to Elite",
    highlight: false,
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trialStarted = searchParams.get("trial") === "started";
  const { platformConnections, profile, signedIn, signOut, songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const connected = platformConnections.filter((platform) => platform.status === "connected").length;
  const incomplete = platformConnections.filter((platform) => platform.status !== "connected").length;
  const gapsClosed = songs.flatMap((song) => song.revenueStreams).filter((stream) => stream.status === "collecting").length;

  async function startCheckout(planId: string) {
    setCheckingOut(planId);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          successUrl: `${window.location.origin}/settings?trial=started`,
          cancelUrl: `${window.location.origin}/settings`,
        }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) router.push(data.url);
    } catch {
      // noop — user stays on page
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <AppShell title="Profile" eyebrow="Operations">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Artist profile</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">{profile.artistName}</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                {profile.role} · Free tier · 3-song starter catalog
              </p>
            </div>
            <div className="rounded-xl border-[0.5px] border-white/15 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">The Gap</div>
              <div className="mt-1 text-3xl font-normal">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <ProfileMetric label="Songs tracked" value={`${summary.totalSongs}/3`} />
          <ProfileMetric label="Platforms ready" value={`${connected}/${platformConnections.length}`} />
          <ProfileMetric label="Gaps closed" value={`${gapsClosed}`} />
        </section>

        <section className="mt-5 grid gap-3">
          <ProfileLink
            href="/platforms"
            title="Platform connections"
            detail={`${connected} connected · ${incomplete} need attention`}
            body="Distributor, PRO, SoundExchange, MLC, YouTube, Spotify, and Apple Music status."
          />
          <ProfileLink
            href="/notifications"
            title="Notifications"
            detail="Gap alerts · Runway checkpoints · platform issues"
            body="Choose the alerts that reduce confusion and keep the creator moving."
          />
          <ProfileLink
            href="/guild"
            title="The Guild"
            detail="Opt-in collaboration network"
            body="Find collaborators without turning the app into a public social feed."
          />
        </section>

        {/* Trial started banner */}
        {trialStarted && (
          <div className="mt-5 rounded-xl border-[0.5px] border-[#97c459]/50 bg-[#eaf3de] px-4 py-3 text-sm text-[#3b6d11]">
            Pro trial started. Full access unlocked for 7 days.
          </div>
        )}

        {/* Pricing tiers */}
        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Subscription</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`overflow-hidden rounded-xl border-[0.5px] ${
                  plan.highlight
                    ? "border-[#0d0d0b] bg-[#0d0d0b] text-white"
                    : "border-black/15 bg-[#f5f4f0] text-[#111]"
                }`}
              >
                <div className="px-4 py-4">
                  {plan.highlight && (
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#ef9f27]">Most popular</div>
                  )}
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] opacity-50">{plan.name}</div>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-[32px] font-light leading-none">{plan.price}</span>
                    {plan.interval && <span className="text-sm opacity-40">{plan.interval}</span>}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs opacity-70">
                        <span className="mt-0.5 shrink-0 text-[#97c459]">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.cta && (
                  <div className={`border-t px-4 py-3 ${plan.highlight ? "border-white/10" : "border-black/10"}`}>
                    <button
                      type="button"
                      onClick={() => startCheckout(plan.id)}
                      disabled={checkingOut === plan.id}
                      className={`w-full rounded-lg py-2 text-sm font-medium transition disabled:opacity-50 ${
                        plan.highlight
                          ? "bg-white text-[#0d0d0b] hover:bg-white/90"
                          : "bg-[#0d0d0b] text-white hover:bg-[#242424]"
                      }`}
                    >
                      {checkingOut === plan.id ? "Opening…" : plan.cta}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#9a9a8a]">
            Cancel anytime. 7-day free trial on Pro. No card needed during trial.
          </p>
        </section>

        {signedIn ? (
          <button type="button" onClick={signOut} className="mt-5 rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
            Sign out
          </button>
        ) : null}
      </main>
    </AppShell>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] px-4 py-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
      <div className="mt-2 text-2xl font-normal text-[#111]">{value}</div>
    </div>
  );
}

function ProfileLink({ href, title, detail, body }: { href: string; title: string; detail: string; body: string }) {
  return (
    <Link href={href} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[15px] font-medium text-[#111]">{title}</div>
          <p className="mt-2 text-sm leading-6 text-[#514d47]">{body}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6b6b65]">{detail}</span>
      </div>
    </Link>
  );
}
