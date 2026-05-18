"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  const [upgraded, setUpgraded] = useState<string | null>(null);
  const [trialStarted, setTrialStarted] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setTrialStarted(p.get("trial") === "started");
    setUpgraded(p.get("upgraded"));
  }, []);
  const { platformConnections, profile, signedIn, signOut, songs, updateProfile } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Mark plan upgrade from Stripe redirect
  if (upgraded && profile.plan !== upgraded) {
    updateProfile({ plan: upgraded as "pro" | "elite" });
  }
  const connected = platformConnections.filter((platform) => platform.status === "connected").length;
  const incomplete = platformConnections.filter((platform) => platform.status !== "connected").length;
  const gapsClosed = songs.flatMap((song) => song.revenueStreams).filter((stream) => stream.status === "collecting").length;

  async function startCheckout(planId: string) {
    setCheckingOut(planId);
    setBillingError(null);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          email: profile.email ?? undefined,
          successUrl: `${window.location.origin}/settings?upgraded=${planId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/settings`,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok) {
        setBillingError(data.error ?? "Billing is unavailable right now.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setBillingError("Billing session could not be created.");
    } catch {
      setBillingError("Billing is unavailable right now.");
    } finally {
      setCheckingOut(null);
    }
  }

  async function openBillingPortal() {
    if (!profile.stripeCustomerId) {
      setBillingError("This account does not have an active billing customer yet.");
      return;
    }

    setOpeningPortal(true);
    setBillingError(null);
    try {
      const res = await fetch("/api/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: profile.stripeCustomerId,
          returnUrl: `${window.location.origin}/settings`,
        }),
      });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok) {
        setBillingError(data.error ?? "Billing portal is unavailable right now.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setBillingError("Billing portal could not be opened.");
    } catch {
      setBillingError("Billing portal is unavailable right now.");
    } finally {
      setOpeningPortal(false);
    }
  }

  return (
    <AppShell title="Profile" eyebrow="Operations">
      <main className="mx-auto max-w-3xl space-y-4 text-white/90">
        <section className="rounded-[24px] glass-dark card-shadow-dark p-6 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Artist profile</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">{profile.artistName}</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                {profile.role} · {profile.plan === "elite" ? "Elite" : profile.plan === "pro" ? "Pro" : "Free"} · {profile.plan === "free" ? "3-song starter catalog" : "Unlimited catalog"}
              </p>
            </div>
            <div className="rounded-xl border-[0.5px] border-white/15 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">The Gap</div>
              <div className="mt-1 text-3xl font-normal">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <ProfileMetric label="Songs tracked" value={profile.plan === "free" ? `${summary.totalSongs}/3` : `${summary.totalSongs}`} />
          <ProfileMetric label="Platforms ready" value={`${connected}/${platformConnections.length}`} />
          <ProfileMetric label="Gaps closed" value={`${gapsClosed}`} />
        </section>

        <section className="grid gap-3">
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
          <div className="rounded-[16px] border-[0.5px] border-[#5fcf7e]/30 bg-[#5fcf7e]/10 px-4 py-3 text-sm text-[#5fcf7e]">
            Pro trial started. Full access unlocked for 7 days.
          </div>
        )}

        {/* Goals & target — editable */}
        <GoalsEditor />

        <SpotifyArtistIdInput />

        {/* API integrations status */}
        <ApiIntegrationsStatus />

        {/* Pricing tiers */}
        <section className="space-y-3">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Subscription</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const isActive = profile.plan === plan.id;
              const isHigher = (plan.id === "elite" && profile.plan === "pro") || (plan.id === "pro" && profile.plan === "elite");
              return (
              <div
                key={plan.id}
                className={`overflow-hidden rounded-[20px] ${
                  isActive
                    ? "ring-2 ring-[#97c459]"
                    : ""
                } ${
                  plan.highlight
                    ? "glass-dark card-shadow-dark text-white"
                    : "glass card-shadow text-white/90"
                }`}
              >
                <div className="px-4 py-4">
                  {isActive ? (
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#97c459]">Current plan</div>
                  ) : plan.highlight && !isHigher ? (
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#ef9f27]">Most popular</div>
                  ) : null}
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
                {plan.cta && !isActive && (
                  <div className={`border-t px-4 py-3 ${plan.highlight ? "border-white/10" : "border-white/[0.07]"}`}>
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
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-white/50">
            Cancel anytime. 7-day free trial on Pro. No card needed during trial.
          </p>
          {profile.stripeCustomerId ? (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={openingPortal}
              className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {openingPortal ? "Opening billing…" : "Manage billing"}
            </button>
          ) : null}
          {billingError ? (
            <p className="mt-3 rounded-xl border border-[#e24b4a]/20 bg-[#e24b4a]/10 px-3 py-2 text-xs text-[#f5b3b3]">
              {billingError}
            </p>
          ) : null}
        </section>

        {signedIn ? (
          <button type="button" onClick={signOut} className="rounded-xl glass card-shadow px-5 py-2.5 text-sm text-[var(--text-muted)] press">
            Sign out
          </button>
        ) : null}
      </main>
    </AppShell>
  );
}

const API_INTEGRATIONS = [
  { name: "MusicBrainz", description: "ISRC lookup, metadata verification", free: true, envKey: null },
  { name: "iTunes Search", description: "Apple Music catalog search, artwork", free: true, envKey: null },
  { name: "TheAudioDB", description: "Artist bios, photos, album art (free tier)", free: true, envKey: null },
  { name: "Bandsintown", description: "Live events and show data", free: true, envKey: null },
  { name: "Lyrics.ovh", description: "Song lyrics lookup", free: true, envKey: null },
  { name: "Odesli / song.link", description: "Streaming links across all DSPs from any ISRC — no key needed", free: true, envKey: null },
  { name: "Deezer", description: "Global charts, artist data, track search — no key needed", free: true, envKey: null },
  { name: "Last.fm", description: "Similar artists, listener counts", free: true, envKey: "LASTFM_API_KEY" },
  { name: "TasteDive", description: "Similar artist recommendations for Career Twin", free: true, envKey: "TASTEDIVE_API_KEY" },
  { name: "Genius", description: "Lyrics, annotations, song knowledge", free: true, envKey: "GENIUS_ACCESS_TOKEN" },
  { name: "Resend", description: "In-app email sending for pitch campaigns", free: true, envKey: "RESEND_API_KEY" },
  { name: "Groq", description: "AI pitch generation (free tier)", free: true, envKey: "GROQ_API_KEY" },
  { name: "Musixmatch", description: "Synchronized lyrics, lyric snippets", free: false, envKey: "MUSIXMATCH_API_KEY" },
  { name: "Songstats", description: "Live streaming stats, playlist placements", free: false, envKey: "SONGSTATS_API_KEY" },
  { name: "Radiostats", description: "Radio airplay analytics", free: false, envKey: "SONGSTATS_API_KEY" },
  { name: "AI Mastering", description: "Automated audio mastering (premium)", free: false, envKey: "AIMASTERING_API_KEY" },
];

function ApiIntegrationsStatus() {
  const freeApis = API_INTEGRATIONS.filter((a) => a.free && !a.envKey);
  const freeWithKey = API_INTEGRATIONS.filter((a) => a.free && a.envKey);
  const paidApis = API_INTEGRATIONS.filter((a) => !a.free);

  return (
    <section className="rounded-[20px] glass card-shadow p-5">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">API integrations</div>

      <div className="mb-4">
        <div className="mb-2 text-[11px] font-medium text-[#5fcf7e]">Active — no key needed</div>
        <div className="space-y-1.5">
          {freeApis.map((api) => (
            <div key={api.name} className="flex items-center justify-between rounded-lg bg-[#5fcf7e]/8 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-white/90">{api.name}</span>
                <span className="ml-2 text-xs text-white/50">{api.description}</span>
              </div>
              <span className="text-[10px] font-medium text-[#5fcf7e]">✓ Active</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-[11px] font-medium text-[#f0a832]">Free — add key to Vercel</div>
        <div className="space-y-1.5">
          {freeWithKey.map((api) => (
            <div key={api.name} className="flex items-center justify-between rounded-lg bg-[#f0a832]/8 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-white/90">{api.name}</span>
                <span className="ml-2 text-xs text-white/50">{api.description}</span>
              </div>
              <code className="text-[10px] text-[#f0a832]">{api.envKey}</code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-medium text-white/50">Paid API — requires subscription</div>
        <div className="space-y-1.5">
          {paidApis.map((api) => (
            <div key={api.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-white/90">{api.name}</span>
                <span className="ml-2 text-xs text-white/50">{api.description}</span>
              </div>
              <code className="text-[10px] text-white/50">{api.envKey}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoalsEditor() {
  const { profile, updateProfile } = usePocket();
  const [goal, setGoal] = useState(profile.mainGoal ?? "");
  const [window, setWindow] = useState(profile.targetWindow ?? "");
  const [artistName, setArtistName] = useState(profile.artistName ?? "");
  const [managerName, setManagerName] = useState(profile.managerName ?? "");
  const [saved, setSaved] = useState(false);

  function save() {
    updateProfile({ mainGoal: goal.trim(), targetWindow: window.trim(), artistName: artistName.trim() || profile.artistName, managerName: managerName.trim() || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="rounded-[20px] glass card-shadow p-5">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Artist & goals</div>
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">Artist name</label>
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Your artist or band name"
            className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50 placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">AI manager name</label>
          <input
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="e.g. REMY — leave blank for default"
            className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50 placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">Main goal right now</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Release my EP and get 5 playlist placements"
            className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50 placeholder:text-white/30"
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/40 mb-1.5">Target release window</label>
          <input
            value={window}
            onChange={(e) => setWindow(e.target.value)}
            placeholder="e.g. Q3 2026 · August · 90 days"
            className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50 placeholder:text-white/30"
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="btn-electric w-full py-2.5 text-sm font-medium press"
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </section>
  );
}

function SpotifyArtistIdInput() {
  const { profile, updateProfile } = usePocket();
  const [value, setValue] = useState(profile.spotifyArtistId ?? "");
  const [saved, setSaved] = useState(false);

  // Extract ID from full URL if pasted
  function extractId(input: string): string {
    const match = input.match(/artist\/([A-Za-z0-9]+)/);
    return match ? match[1] : input.trim();
  }

  function save() {
    const id = extractId(value);
    setValue(id);
    updateProfile({ spotifyArtistId: id });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="rounded-[20px] glass card-shadow p-5">
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Integrations</div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-white/60">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-white/50">Spotify artist URL or ID</span>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setSaved(false); }}
              placeholder="https://open.spotify.com/artist/... or paste the ID"
              className="h-10 w-full rounded-lg border-[0.5px] border-white/[0.08] bg-white/8 px-3 text-sm text-white/90 outline-none placeholder:text-white/30"
            />
          </label>
          <p className="mt-1.5 text-[11px] text-white/50">Used to pull live stream counts and top playlists via Songstats on your song pages.</p>
          <button
            type="button"
            onClick={save}
            className="mt-2.5 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}


function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] glass card-shadow px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 text-2xl font-normal text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function ProfileLink({ href, title, detail, body }: { href: string; title: string; detail: string; body: string }) {
  return (
    <Link href={href} className="rounded-[20px] glass card-shadow p-5 press block">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[15px] font-medium text-white/90">{title}</div>
          <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/50">{detail}</span>
      </div>
    </Link>
  );
}
