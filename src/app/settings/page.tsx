"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";

export default function SettingsPage() {
  const { platformConnections, profile, signedIn, signOut, songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const connected = platformConnections.filter((platform) => platform.status === "connected").length;
  const incomplete = platformConnections.filter((platform) => platform.status !== "connected").length;
  const gapsClosed = songs.flatMap((song) => song.revenueStreams).filter((stream) => stream.status === "collecting").length;

  return (
    <AppShell title="Profile" eyebrow="Account">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Creator account</div>
              <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">{profile.artistName}</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                {profile.role} · Free tier · up to 3 songs with basic gap detection
              </p>
            </div>
            <div className="rounded-xl border-[0.5px] border-white/15 px-4 py-3 text-right">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Estimated missing</div>
              <div className="mt-1 text-3xl font-normal">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <ProfileMetric label="Songs tracked" value={`${summary.totalSongs}/3`} />
          <ProfileMetric label="Platforms connected" value={`${connected}/${platformConnections.length}`} />
          <ProfileMetric label="Gaps closed" value={`${gapsClosed}`} />
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Connected platforms summary</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-[0.5px] border-black/10 bg-white px-4 py-3 text-sm">
              <div className="text-[#111]">Connected</div>
              <div className="mt-1 text-[#3b6d11]">{connected} data paths ready</div>
            </div>
            <div className="rounded-lg border-[0.5px] border-black/10 bg-white px-4 py-3 text-sm">
              <div className="text-[#111]">Needs attention</div>
              <div className="mt-1 text-[#854f0b]">{incomplete} paths incomplete or missing</div>
            </div>
          </div>
          <Link href="/platforms" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Review platforms
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Financial summary</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Current quarter summary is available on Free. Pro unlocks full history, PDF export, and accountant-ready reporting.
          </p>
          <Link href="/financial" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Open financial summary
          </Link>
          <Link href="/statements" className="ml-2 mt-4 inline-flex rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
            Read statement
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Notifications</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Choose the alerts that reduce stress: gap alerts, release checkpoints, platform issues, summaries, statement updates, and posting confirmations.
          </p>
          <Link href="/notifications" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Manage notifications
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Release Radar</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Build the release countdown from each song date: registration, pitching, metadata, promo, final checks, release day, and post-release review.
          </p>
          <Link href="/radar" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Open Release Radar
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Next action queue</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Free shows one top action. Pro unlocks the full prioritized queue and lets creators work through every gap.
          </p>
          <Link href="/actions" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Preview action queue
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">EPK Builder</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Pro release asset for press, playlists, sync, booking, and partner outreach. Public link and PDF export come with the backend phase.
          </p>
          <Link href="/epk" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Build EPK
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">EP / Album Builder</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Group catalog songs into a release package and see combined readiness, gaps, UPC status, and missing items before distribution.
          </p>
          <Link href="/albums" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Build EP / Album
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Beat Licensing</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Producer-focused license logging for leases, exclusives, revenue, expiry dates, and conflict flags.
          </p>
          <Link href="/beats" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Open beat licensing
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Contract Scanner</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Legal-awareness preview for clause flags, plain-English explanations, and attorney questions. Not legal advice.
          </p>
          <Link href="/contracts" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Open contract scanner
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Income Forecast</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Compare current registration income against the fully optimized catalog scenario for 3, 6, and 12 months.
          </p>
          <Link href="/forecast" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            Open forecast
          </Link>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Subscription</div>
          <p className="mt-3 text-sm leading-6 text-[#514d47]">
            Free tier tracks up to 3 songs, shows gap ranges, and gives one next action at a time. Pro unlocks exact estimates, unlimited songs, full queue, Release Radar, statements, split sheets, and exports.
          </p>
          <button type="button" className="mt-4 rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
            Start 7-day Pro trial
          </button>
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
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
      <div className="mt-2 text-2xl font-normal text-[#111]">{value}</div>
    </div>
  );
}
