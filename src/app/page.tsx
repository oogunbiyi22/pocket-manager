"use client";

import Link from "next/link";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getCatalogReadinessScore,
  getNextRevenueAction,
  getReadinessLevel,
  getRevenueGapSummary,
  seedSongs,
} from "@/lib/backstage-data";

const FEATURES = [
  { label: "Gap Engine", body: "Finds uncollected royalties across every stream type — streaming, PRO, SoundExchange, MLC, YouTube." },
  { label: "Next Action Engine", body: "Prioritizes by dollar value, ease, and platform urgency. One clear move at a time." },
  { label: "Release Radar", body: "Pre-release countdown with milestone checkpoints — art, metadata, outreach, platform delivery." },
  { label: "Pocket capture", body: "One tap to log ideas, tasks, links, and voice memos. Route to a song or the Vault." },
  { label: "A — AI manager", body: "Context-aware chat wired to your catalog. Knows the songs, the gaps, the next action." },
  { label: "Signal", body: "Pitch tracker, EPK, sync briefs, and Promo Studio — all sourced from real catalog metadata." },
];

export default function Home() {
  const { platformConnections, songs } = usePocket();
  const catalog = songs.length ? songs : seedSongs;
  const summary = getRevenueGapSummary(catalog);
  const nextAction = getNextRevenueAction(catalog);
  const catalogReadiness = getCatalogReadinessScore(catalog);
  const readinessLevel = getReadinessLevel(catalogReadiness);
  const missingPlatforms = platformConnections.filter((p) => p.status !== "connected").length;

  return (
    <div className="min-h-screen bg-[#0d0d0b] text-white">

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[rgba(13,13,11,0.88)] px-5 py-4 backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Pocket</div>
            <div className="text-base font-normal tracking-tight text-white">Manager</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/home" className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm text-white/55 transition hover:border-white/25 sm:block">
              Open app
            </Link>
            <Link href="/onboarding" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0d0d0b] transition hover:bg-white/90">
              Find my gap →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#ef9f27]/40 bg-[#ef9f27]/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#ef9f27]">
              Creator revenue intelligence
            </div>
            <h1 className="text-[48px] font-light leading-[1.05] tracking-[-0.04em] sm:text-[64px] lg:text-[72px]">
              Close the Gap between what you earn and what you collect.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/45">
              Pocket Manager finds missing royalties across every stream type, tells you exactly what to fix, and gives independent creators the same infrastructure as a major-label artist.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/home" className="rounded-xl bg-white px-6 py-4 text-base font-medium text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]">
                Open phone app
              </Link>
              <Link href="/onboarding" className="rounded-xl border border-white/15 px-6 py-4 text-base text-white/70 transition hover:border-white/30 active:scale-[0.98]">
                Find my first gap
              </Link>
            </div>
          </div>

          {/* Live account card */}
          <div className="overflow-hidden rounded-[24px] border-[0.5px] border-white/10 bg-[#141412]">
            {/* Command surface */}
            <div className="bg-[#1e1e1b] px-5 py-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Total secured</div>
              <div className="mt-2 text-[40px] font-light leading-none tracking-[-0.04em] text-white">
                {formatMoney(summary.totalSecured)}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#97c459] transition-all duration-700"
                  style={{ width: `${catalogReadiness}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/30">
                <span>{catalogReadiness}% ready</span>
                <span>{readinessLevel}</span>
              </div>
            </div>

            {/* Gap strip */}
            {summary.totalEstimatedGap > 0 && (
              <div className="border-y border-[#ef9f27]/20 bg-[#ef9f27]/10 px-5 py-3">
                <span className="text-sm text-[#ef9f27]">
                  ● The Gap · {formatGapEstimate(summary.totalEstimatedGap)} uncollected
                </span>
              </div>
            )}

            {/* Next action */}
            <div className="px-5 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">Next action</div>
              <div className="mt-2 text-[15px] text-white">{nextAction.action} via {nextAction.collectionBody}</div>
              <div className="mt-1 text-xs text-white/35">
                {formatGapEstimate(nextAction.estimatedValue)} · {nextAction.estimatedTime}
              </div>
              <Link
                href={`/projects/${nextAction.songId}`}
                className="mt-3 block rounded-lg bg-white px-4 py-2.5 text-center text-sm font-medium text-[#0d0d0b] transition hover:bg-white/90"
              >
                Start now
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 border-t border-white/[0.06]">
              {[
                { label: "Songs", value: summary.totalSongs },
                { label: "Streams", value: summary.activeIncomeStreams },
                { label: "Missing", value: missingPlatforms },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-3 text-center">
                  <div className="text-[22px] font-light text-white">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-white/[0.06] px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">What it does</div>
            <h2 className="mt-3 text-[36px] font-light tracking-[-0.03em]">Major-label infrastructure. Independent price.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] p-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">{f.label}</div>
                <p className="mt-3 text-sm leading-6 text-white/55">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[36px] font-light tracking-[-0.03em]">Start with one song.</h2>
          <p className="mt-4 text-sm leading-6 text-white/45">
            Add a release, connect one platform, see the first Gap. Takes two minutes. No card needed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/onboarding" className="rounded-xl bg-white px-8 py-4 text-base font-medium text-[#0d0d0b] transition hover:bg-white/90">
              Find my gap →
            </Link>
            <Link href="/home" className="rounded-xl border border-white/15 px-8 py-4 text-base text-white/70 transition hover:border-white/30">
              Open app
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-5 py-6 text-center text-[11px] text-white/20">
        Pocket Manager · Creator revenue intelligence · Independent artists only
      </footer>
    </div>
  );
}
