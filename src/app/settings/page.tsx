"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  // Mark plan upgrade from Stripe redirect
  if (upgraded && profile.plan !== upgraded) {
    updateProfile({ plan: upgraded as "pro" | "elite" });
  }
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
          email: profile.email ?? undefined,
          successUrl: `${window.location.origin}/settings?upgraded=${planId}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/settings`,
        }),
      });
      const data = await res.json() as { url?: string; mock?: boolean };
      if (data.url) {
        if (data.mock) {
          // Dev mode — simulate success without Stripe
          router.push(`/settings?upgraded=${planId}`);
        } else {
          window.location.href = data.url;
        }
      }
    } catch {
      // noop — user stays on page
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <AppShell title="Profile" eyebrow="Operations">
      <main className="mx-auto max-w-3xl space-y-4 text-[#111]">
        <section className="rounded-[24px] glass-dark card-shadow-dark p-6 text-white">
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

        <section className="grid gap-3 sm:grid-cols-3">
          <ProfileMetric label="Songs tracked" value={`${summary.totalSongs}/3`} />
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
          <div className="rounded-[16px] border-[0.5px] border-[#97c459]/50 bg-[#eaf3de] px-4 py-3 text-sm text-[#3b6d11]">
            Pro trial started. Full access unlocked for 7 days.
          </div>
        )}

        {/* Spotify Artist ID + Telegram */}
        <SpotifyArtistIdInput />

        {/* Telegram bot */}
        <TelegramSection />

        {/* API integrations status */}
        <ApiIntegrationsStatus />

        {/* Pricing tiers */}
        <section className="space-y-3">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Subscription</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`overflow-hidden rounded-[20px] ${
                  plan.highlight
                    ? "glass-dark card-shadow-dark text-white"
                    : "glass card-shadow text-[#111]"
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
  { name: "Last.fm", description: "Similar artists, listener counts", free: true, envKey: "LASTFM_API_KEY" },
  { name: "TasteDive", description: "Similar artist recommendations for Career Twin", free: true, envKey: "TASTEDIVE_API_KEY" },
  { name: "Genius", description: "Lyrics, annotations, song knowledge", free: true, envKey: "GENIUS_ACCESS_TOKEN" },
  { name: "Musixmatch", description: "Synchronized lyrics, lyric snippets", free: false, envKey: "MUSIXMATCH_API_KEY" },
  { name: "MusicFetch", description: "Auto-generate links for 40+ DSPs from ISRC", free: false, envKey: "MUSICFETCH_TOKEN" },
  { name: "Songstats", description: "Live streaming stats, playlist placements", free: false, envKey: "SONGSTATS_API_KEY" },
  { name: "Radiostats", description: "Radio airplay analytics", free: false, envKey: "SONGSTATS_API_KEY" },
  { name: "AI Mastering", description: "Automated audio mastering (premium)", free: false, envKey: "AIMASTERING_API_KEY" },
  { name: "Resend", description: "In-app email sending for pitch campaigns", free: true, envKey: "RESEND_API_KEY" },
  { name: "Groq", description: "AI pitch generation (free tier)", free: true, envKey: "GROQ_API_KEY" },
];

function ApiIntegrationsStatus() {
  const freeApis = API_INTEGRATIONS.filter((a) => a.free && !a.envKey);
  const freeWithKey = API_INTEGRATIONS.filter((a) => a.free && a.envKey);
  const paidApis = API_INTEGRATIONS.filter((a) => !a.free);

  return (
    <section className="rounded-[20px] glass card-shadow p-5">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">API integrations</div>

      <div className="mb-4">
        <div className="mb-2 text-[11px] font-medium text-[#3b6d11]">Active — no key needed</div>
        <div className="space-y-1.5">
          {freeApis.map((api) => (
            <div key={api.name} className="flex items-center justify-between rounded-lg bg-[#f0f7e6] px-3 py-2">
              <div>
                <span className="text-sm font-medium text-[#111]">{api.name}</span>
                <span className="ml-2 text-xs text-[#6b6b65]">{api.description}</span>
              </div>
              <span className="text-[10px] font-medium text-[#3b6d11]">✓ Active</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-[11px] font-medium text-[#854f0b]">Free — add key to Vercel</div>
        <div className="space-y-1.5">
          {freeWithKey.map((api) => (
            <div key={api.name} className="flex items-center justify-between rounded-lg bg-[#fef9f0] px-3 py-2">
              <div>
                <span className="text-sm font-medium text-[#111]">{api.name}</span>
                <span className="ml-2 text-xs text-[#6b6b65]">{api.description}</span>
              </div>
              <code className="text-[10px] text-[#854f0b]">{api.envKey}</code>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-medium text-[#9a9a8a]">Paid API — requires subscription</div>
        <div className="space-y-1.5">
          {paidApis.map((api) => (
            <div key={api.name} className="flex items-center justify-between rounded-lg bg-[#f8f6f1] px-3 py-2">
              <div>
                <span className="text-sm font-medium text-[#111]">{api.name}</span>
                <span className="ml-2 text-xs text-[#6b6b65]">{api.description}</span>
              </div>
              <code className="text-[10px] text-[#9a9a8a]">{api.envKey}</code>
            </div>
          ))}
        </div>
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
      <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Integrations</div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-[#514d47]">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-[#9a9a8a]">Spotify artist URL or ID</span>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setSaved(false); }}
              placeholder="https://open.spotify.com/artist/... or paste the ID"
              className="h-10 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none placeholder:text-[#bbb]"
            />
          </label>
          <p className="mt-1.5 text-[11px] text-[#9a9a8a]">Used to pull live stream counts and top playlists via Songstats on your song pages.</p>
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

function TelegramSection() {
  const [botStatus, setBotStatus] = useState<null | { ok: boolean; bot?: { username?: string; first_name?: string }; error?: string }>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/telegram/status")
      .then((r) => r.json() as Promise<{ ok: boolean; bot?: { username?: string; first_name?: string }; error?: string }>)
      .then(setBotStatus)
      .catch(() => setBotStatus({ ok: false, error: "Not configured" }));
  }, []);

  async function connectWebhook() {
    setConnecting(true);
    setConnectResult(null);
    try {
      const res = await fetch("/api/telegram/connect", { method: "POST" });
      const data = await res.json() as { ok: boolean; webhook?: string; description?: string; error?: string };
      if (data.ok) {
        setConnectResult(`✓ Webhook set to ${data.webhook}`);
      } else {
        setConnectResult(`✕ ${data.error ?? data.description ?? "Failed"}`);
      }
    } catch {
      setConnectResult("✕ Request failed");
    } finally {
      setConnecting(false);
    }
  }

  const configured = botStatus?.ok;

  return (
    <section className="rounded-[20px] glass card-shadow p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Telegram bot</div>
        {botStatus && (
          <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${configured ? "bg-[#eaf3de] text-[#3b6d11]" : "bg-[#f8f6f1] text-[#9a9a8a]"}`}>
            {configured ? `✓ @${botStatus.bot?.username ?? "connected"}` : "Not configured"}
          </span>
        )}
      </div>

      {configured ? (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#514d47]">
            Your bot <strong>@{botStatus?.bot?.username}</strong> is connected. Message it on Telegram to get gap updates, revenue status, and ask A anything.
          </p>
          <button
            type="button"
            onClick={connectWebhook}
            disabled={connecting}
            className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {connecting ? "Reconnecting…" : "Reconnect webhook"}
          </button>
          {connectResult && (
            <p className="text-[11px] text-[#6b6b65] font-mono">{connectResult}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#514d47]">
            Connect a Telegram bot to chat with A, get gap alerts, and check your catalog status from anywhere.
          </p>
          <div className="rounded-lg bg-[#f8f6f1] px-4 py-3 text-[11px] text-[#514d47] space-y-1.5">
            <p><strong>Setup:</strong></p>
            <p>1. Message @BotFather on Telegram and create a bot</p>
            <p>2. Add <code className="bg-white px-1 rounded text-[#111]">TELEGRAM_BOT_TOKEN</code> to Vercel env vars</p>
            <p>3. Redeploy, then click &quot;Connect webhook&quot; below</p>
          </div>
          <button
            type="button"
            onClick={connectWebhook}
            disabled={connecting || !botStatus}
            className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {connecting ? "Connecting…" : "Connect webhook"}
          </button>
          {connectResult && (
            <p className="text-[11px] text-[#6b6b65] font-mono">{connectResult}</p>
          )}
        </div>
      )}
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
          <div className="text-[15px] font-medium text-[#111]">{title}</div>
          <p className="mt-2 text-sm leading-6 text-[#514d47]">{body}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6b6b65]">{detail}</span>
      </div>
    </Link>
  );
}
