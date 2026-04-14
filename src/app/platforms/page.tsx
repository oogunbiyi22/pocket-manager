"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";

// ─── Platform metadata ──────────────────────────────────────────────────────
const PLATFORM_META: Record<string, {
  streamLabel: string;
  gapHint: string;
  connectUrl: string;        // Direct URL to register / connect
  connectLabel: string;      // CTA text
  guide: string;             // One-line guide shown when not connected
  estimatedMinutes: number;  // Rough setup time in minutes
}> = {
  distrokid: {
    streamLabel: "Streaming distribution",
    gapHint: "Your distribution deal determines how fast you get paid from all DSPs",
    connectUrl: "https://distrokid.com/vip/seven/1234567", // referral optional
    connectLabel: "Open DistroKid",
    guide: "Log in, go to Bank → make sure your bank account is verified and payout is enabled",
    estimatedMinutes: 3,
  },
  tunecore: {
    streamLabel: "Streaming distribution",
    gapHint: "TuneCore pays 100% royalties — make sure your payout method is active",
    connectUrl: "https://www.tunecore.com/",
    connectLabel: "Open TuneCore",
    guide: "Log in, check Settings → Payment to confirm your bank or PayPal is linked",
    estimatedMinutes: 3,
  },
  cdbaby: {
    streamLabel: "Streaming distribution",
    gapHint: "CD Baby keeps a % — verify your earnings dashboard is showing correctly",
    connectUrl: "https://members.cdbaby.com/",
    connectLabel: "Open CD Baby",
    guide: "Check My Sales → confirm payment info is set up under Account Settings",
    estimatedMinutes: 3,
  },
  ascap: {
    streamLabel: "Performance royalties (writer)",
    gapHint: "ASCAP collects performance royalties for radio, TV, streaming. Registration = retroactive claims",
    connectUrl: "https://www.ascap.com/help/career-development/songwriter-composer-publisher-guide",
    connectLabel: "Register with ASCAP",
    guide: "Create writer account at ascap.com → register each song under My Works",
    estimatedMinutes: 10,
  },
  bmi: {
    streamLabel: "Performance royalties (writer)",
    gapHint: "BMI is free for songwriters. Each unregistered song is leaving performance royalties uncollected",
    connectUrl: "https://repertoire.bmi.com/",
    connectLabel: "Register with BMI",
    guide: "Log in at bmi.com → go to Repertoire → add each song title, ISRC, and your writer share",
    estimatedMinutes: 10,
  },
  sesac: {
    streamLabel: "Performance royalties (writer)",
    gapHint: "SESAC is invite-only but more efficient for certain genres",
    connectUrl: "https://www.sesac.com/licensing/affiliate-with-us/",
    connectLabel: "Apply to SESAC",
    guide: "Apply via sesac.com → approval takes 2–4 weeks → then register works in your portal",
    estimatedMinutes: 15,
  },
  soundexchange: {
    streamLabel: "Digital performance royalties (master)",
    gapHint: "SoundExchange pays the sound recording owner (usually you) for digital radio plays. Completely separate from your PRO",
    connectUrl: "https://www.soundexchange.com/service-provider/register/",
    connectLabel: "Register with SoundExchange",
    guide: "Register at soundexchange.com → confirm you're the master rights owner → register your releases",
    estimatedMinutes: 15,
  },
  mlc: {
    streamLabel: "Mechanical royalties (digital)",
    gapHint: "The MLC collects mechanical royalties for streaming in the US. Unclaimed money sits in a pool — claim it before the deadline",
    connectUrl: "https://portal.themlc.com/",
    connectLabel: "Register with The MLC",
    guide: "Create account at themlc.com → register as songwriter/publisher → claim each song and ISRC",
    estimatedMinutes: 20,
  },
  youtube: {
    streamLabel: "YouTube Content ID",
    gapHint: "Content ID catches every UGC video using your song — without it you earn $0 from fan videos",
    connectUrl: "https://studio.youtube.com/",
    connectLabel: "Open YouTube Studio",
    guide: "Apply for Content ID via YouTube Studio → or use your distributor's Content ID service (DistroKid, CD Baby)",
    estimatedMinutes: 5,
  },
  spotify: {
    streamLabel: "Streaming analytics",
    gapHint: "Spotify for Artists gives you real-time stream data — needed to verify your royalty statements",
    connectUrl: "https://artists.spotify.com/",
    connectLabel: "Claim on Spotify",
    guide: "Go to artists.spotify.com → claim your profile → verify via your distributor email",
    estimatedMinutes: 5,
  },
  apple_music: {
    streamLabel: "Streaming analytics",
    gapHint: "Apple Music for Artists shows stream counts and Shazams — used to cross-check payments",
    connectUrl: "https://artists.apple.com/",
    connectLabel: "Claim on Apple Music",
    guide: "Visit artists.apple.com → request access for your artist profile",
    estimatedMinutes: 5,
  },
};

type ConnectionState = "idle" | "connecting" | "done";

export default function PlatformsPage() {
  const { platformConnections, songs, updatePlatformConnection } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const groups = ["Distributor", "PRO", "Digital Performance", "Publishing", "Content ID", "Analytics"] as const;

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const connectedCount = platformConnections.filter((p) => p.status === "connected").length;
  const totalCount = platformConnections.length;
  const connectionPct = Math.round((connectedCount / totalCount) * 100);

  function handleConnect(platformId: string, connectUrl: string) {
    // Open the external registration page
    window.open(connectUrl, "_blank", "noopener,noreferrer");
    // Set connecting state — user comes back and marks as done
    setConnectingId(platformId);
  }

  function markConnected(platformId: string) {
    updatePlatformConnection(platformId, "connected");
    setConnectingId(null);
  }

  return (
    <AppShell title="Platforms" eyebrow="Connection status">
      <main className="mx-auto max-w-3xl space-y-4 text-[var(--text-primary)]">

        {/* Command surface */}
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Platform connections</div>
          <div className="mt-3 text-[44px] font-light leading-none tracking-[-0.04em]">
            {connectedCount} <span className="text-[28px] text-white/35">of {totalCount}</span>
          </div>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#97c459] transition-all duration-700"
              style={{ width: `${connectionPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-white/35">
            <span>{connectionPct}% connected</span>
            {summary.totalEstimatedGap > 0 ? (
              <span>{formatGapEstimate(summary.totalEstimatedGap)} catalog gap open</span>
            ) : (
              <span>Catalog fully connected</span>
            )}
          </div>
          <p className="mt-4 text-sm leading-7 text-white/45">
            Each platform controls a different royalty door. Connecting all of them is how you close The Gap.
          </p>
        </section>

        {/* Groups */}
        {groups.map((group) => {
          const platforms = platformConnections.filter((p) => p.group === group);
          if (!platforms.length) return null;

          return (
            <section key={group} className="overflow-hidden rounded-[24px] glass card-shadow">
              <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{group}</div>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {platforms.map((platform) => {
                  const meta = PLATFORM_META[platform.id];
                  const isConnecting = connectingId === platform.id;
                  const isExpanded = expanded === platform.id;

                  return (
                    <div key={platform.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : platform.id)}
                            className="flex items-center gap-2 text-left"
                          >
                            <div className="text-[15px] font-medium text-[var(--text-primary)]">{platform.name}</div>
                            <span className="text-[10px] text-[var(--text-muted)]">{isExpanded ? "▲" : "▼"}</span>
                          </button>
                          <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                            {meta?.streamLabel ?? group} · {platform.method}
                          </div>
                        </div>
                        <PlatformStatusBadge
                          status={platform.status}
                          isConnecting={isConnecting}
                        />
                      </div>

                      {/* Expanded details */}
                      {isExpanded && meta && (
                        <div className="mt-3 space-y-3">
                          <div className="rounded-[12px] glass-subtle px-4 py-3 text-[13px] leading-6 text-[var(--text-muted)]">
                            <strong className="text-[var(--text-primary)]">Why it matters:</strong> {meta.gapHint}
                          </div>
                          {platform.status !== "connected" && (
                            <div className="rounded-[12px] bg-[#faeeda] px-4 py-3 text-[13px] leading-6 text-[#854f0b]">
                              <strong>How to connect:</strong> {meta.guide}
                              <div className="mt-1 text-[11px] opacity-70">~{meta.estimatedMinutes} min</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action row */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {platform.status === "connected" ? (
                          <>
                            <span className="flex-1 text-xs text-[var(--text-muted)]">Last synced: just now</span>
                            <a
                              href={meta?.connectUrl ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl glass-subtle px-3 py-1.5 text-xs text-[var(--text-muted)] press"
                            >
                              Review →
                            </a>
                            <button
                              type="button"
                              onClick={() => updatePlatformConnection(platform.id, "not_connected")}
                              className="rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] press"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : isConnecting ? (
                          <>
                            <span className="flex-1 text-xs text-[#854f0b]">Complete setup on the external page, then confirm below →</span>
                            <button
                              type="button"
                              onClick={() => markConnected(platform.id)}
                              className="rounded-xl bg-[#0d0d0b] px-4 py-2 text-xs font-semibold text-white press"
                            >
                              Mark connected ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setConnectingId(null)}
                              className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-muted)] press"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {platform.status === "incomplete" && (
                              <span className="flex-1 text-xs text-[var(--text-muted)]">{platform.missingStep}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleConnect(platform.id, meta?.connectUrl ?? "#")}
                              className="rounded-xl bg-[#0d0d0b] px-4 py-2 text-xs font-semibold text-white press"
                            >
                              {meta?.connectLabel ?? "Connect →"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Info card */}
        <section className="rounded-[24px] glass-subtle px-5 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Why so many platforms?</div>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Music royalties are split across 5+ separate systems that don't talk to each other.
            Your distributor pays streaming income. Your PRO collects performance royalties.
            SoundExchange handles digital radio. The MLC handles US mechanicals.
            Each one is a separate door — and each unopened door is uncollected money.
          </p>
        </section>
      </main>
    </AppShell>
  );
}

function PlatformStatusBadge({
  status,
  isConnecting,
}: {
  status: "connected" | "not_connected" | "incomplete";
  isConnecting: boolean;
}) {
  if (isConnecting) {
    return (
      <span className="shrink-0 rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#854f0b]">
        Connecting…
      </span>
    );
  }
  if (status === "connected") {
    return (
      <span className="shrink-0 rounded-full bg-[#eaf3de] px-3 py-1 text-[11px] font-medium text-[#3b6d11]">
        Connected ✓
      </span>
    );
  }
  if (status === "incomplete") {
    return (
      <span className="shrink-0 rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#854f0b]">
        Incomplete
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-[#fcebeb] px-3 py-1 text-[11px] font-medium text-[#a32d2d]">
      Not connected
    </span>
  );
}
