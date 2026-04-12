"use client";

import Link from "next/link";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getNextRevenueAction,
  getRevenueGapSummary,
  seedSongs,
} from "@/lib/backstage-data";

export default function Home() {
  const { platformConnections, songs } = usePocket();
  const catalog = songs.length ? songs : seedSongs;
  const summary = getRevenueGapSummary(catalog);
  const nextAction = getNextRevenueAction(catalog);
  const missingPlatforms = platformConnections.filter((platform) => platform.status !== "connected").length;

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#111]">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b-[0.5px] border-black/15 pb-5">
          <Link href="/" className="text-base font-normal tracking-tight text-[#111]">
            Pocket Manager
          </Link>
          <div className="flex gap-3 text-sm">
            <Link href="/settings" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-[#514d47]">
              Profile
            </Link>
            <Link href="/mobile" className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-white">
              Open app
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="mb-4 inline-flex rounded-full border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27]/20 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#854f0b]">
              Creator revenue intelligence
            </div>
            <h1 className="max-w-4xl text-5xl font-normal tracking-[-0.05em] text-[#111] sm:text-6xl lg:text-7xl">
              It finds the money you are missing, manages the operation, and creates the content that moves it.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#514d47]">
              Pocket Manager sits above music platforms, checks your catalog, spots missing revenue paths, and gives independent creators major-label infrastructure in their pocket.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/mobile" className="rounded-lg bg-[#0a0a0a] px-6 py-4 font-medium text-white transition hover:bg-black/80">
                Open phone app beta
              </Link>
              <Link href="/onboarding" className="rounded-lg border-[0.5px] border-black/15 px-6 py-4 font-medium text-[#111] transition hover:bg-white">
                Find my first gap
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ["Song catalog", "Add releases by ISRC, import, or manual entry."],
                ["Revenue gap engine", "See what is collected, missing, and estimated."],
                ["Next action", "Handle one highest-value fix at a time."],
              ].map(([label, copy]) => (
                <div key={label} className="rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">{label}</div>
                  <div className="mt-2 text-sm leading-6 text-[#514d47]">{copy}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border-[0.5px] border-black/15 bg-white p-5">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Total secured</div>
              <div className="mt-3 text-5xl font-normal tracking-[-0.04em]">{formatMoney(summary.totalSecured)}</div>
              <div className="mt-3 text-sm text-white/55">{summary.activeIncomeStreams} active income streams this quarter</div>
            </div>

            <div className="mt-4 rounded-xl border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27] px-4 py-3 text-[#854f0b]">
              {summary.songsWithGaps} songs not fully registered · {formatGapEstimate(summary.totalEstimatedGap)} uncollected
            </div>

            <div className="mt-4 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Next action</div>
              <div className="mt-3 text-xl font-normal leading-7 text-[#111]">{nextAction.title}</div>
              <div className="mt-3 text-sm text-[#514d47]">
                Recovery: {formatGapEstimate(nextAction.estimatedValue)} · Time: {nextAction.estimatedTime}
              </div>
              <Link href={`/projects/${nextAction.songId}`} className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Start
              </Link>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3">
                {summary.totalSongs} songs in catalog
              </div>
              <div className="rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3">
                {missingPlatforms} platform paths need attention
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
