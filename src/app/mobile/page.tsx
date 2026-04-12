"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatMoney,
  formatGapEstimate,
  getNextRevenueAction,
  getRevenueGapSummary,
  getSongGapScore,
  getSongReadinessScore,
} from "@/lib/backstage-data";

export default function MobilePage() {
  const { completeRevenueAction, songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const [clearedActions, setClearedActions] = useState<string[]>([]);
  const availableSongs = useMemo(
    () =>
      songs
        .map((song) => ({
          ...song,
          revenueStreams: song.revenueStreams.filter((stream) => !clearedActions.includes(`${song.id}-${stream.streamType}-${stream.collectionBody}`)),
        }))
        .filter((song) => song.revenueStreams.length > 0),
    [clearedActions, songs],
  );
  const nextAction = getNextRevenueAction(availableSongs.length ? availableSongs : songs);
  const activeActionId = `${nextAction.songId}-${nextAction.streamType}-${nextAction.collectionBody}`;
  const actionIsClearable = nextAction.estimatedValue > 0;

  function clearCurrentAction() {
    if (!actionIsClearable) {
      return;
    }

    setClearedActions((current) => (current.includes(activeActionId) ? current : [...current, activeActionId]));
  }

  function completeCurrentAction() {
    if (!actionIsClearable) {
      return;
    }

    completeRevenueAction(nextAction.songId, nextAction.streamType, nextAction.collectionBody);
    setClearedActions((current) => current.filter((item) => item !== activeActionId));
  }

  return (
    <AppShell title="Pocket Manager" eyebrow="Revenue intelligence">
      <main className="mx-auto max-w-md overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f4f1eb] text-[#111]">
        <header className="flex items-center justify-between bg-[#f4f1eb] px-5 py-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5d5a54]">Pocket</div>
            <div className="text-[15px] text-[#111]">Revenue command</div>
          </div>
          <Link
            href="/settings"
            className="grid size-10 place-items-center rounded-full border border-black/10 bg-white text-sm text-[#111]"
            aria-label="Open profile"
          >
            B
          </Link>
        </header>

        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Total secured</div>
          <div className="mt-3 text-5xl font-normal tracking-[-0.04em]">{formatMoney(summary.totalSecured)}</div>
          <div className="mt-3 text-sm text-white/55">
            {summary.activeIncomeStreams} active income stream{summary.activeIncomeStreams === 1 ? "" : "s"} this quarter
          </div>
        </section>

        {summary.totalEstimatedGap > 0 ? (
          <details className="group border-y border-[#ef9f27]/40 bg-[#ef9f27]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-[#854f0b] marker:hidden">
              <span>
                {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"} not fully registered ·{" "}
                {formatGapEstimate(summary.totalEstimatedGap)} uncollected
              </span>
              <span className="rounded-full border border-[#854f0b]/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em]">
                Details
              </span>
            </summary>
            <div className="border-t border-[#854f0b]/20 px-5 py-4 text-sm leading-6 text-[#854f0b]">
              Estimates are conservative and rounded down. Tap a song below to see the stream-by-stream math and the platform action to fix it.
            </div>
          </details>
        ) : null}

        <section className="px-5 py-5">
          <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Next action</div>
            <div className="mt-3 text-xl font-normal leading-7 text-[#111]">{nextAction.title}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-[#ef9f27]/20 px-3 py-1 text-[#854f0b]">
                Recovery: {formatGapEstimate(nextAction.estimatedValue)}
              </span>
              <span className="rounded-full bg-black/[0.06] px-3 py-1 text-[#34312d]">
                Time: {nextAction.estimatedTime}
              </span>
            </div>
            <Link
              href={`/projects/${nextAction.songId}`}
              className="mt-4 block rounded-lg bg-[#0a0a0a] px-4 py-3 text-center text-sm font-medium text-white transition duration-200 ease-out hover:bg-[#242424]"
            >
              Start
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={clearCurrentAction} className="rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#5d5a54]">
                Skip for now
              </button>
              <button type="button" onClick={completeCurrentAction} className="rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#5d5a54]">
                Mark done
              </button>
            </div>
            <Link href="/settings" className="mt-3 block text-center text-xs text-[#854f0b]">
              Upgrade to see exact dollar estimates
            </Link>
          </div>
        </section>

        <section className="px-5 pb-6">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Active songs</div>
          <div className="space-y-3">
            {songs.slice(0, 5).map((song) => {
              const gapScore = getSongGapScore(song);
              const readiness = getSongReadinessScore(song);
              const gapTone =
                gapScore >= 60
                  ? "bg-[#e24b4a]/15 text-[#a32d2d]"
                  : gapScore > 0
                    ? "bg-[#ef9f27]/20 text-[#854f0b]"
                    : "bg-[#97c459]/25 text-[#3b6d11]";
              const openGaps = song.revenueStreams.filter((stream) => stream.estimatedGap > 0).length;

              return (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="block rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition duration-200 ease-out hover:border-black/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-normal text-[#111]">{song.title}</div>
                      <div className="mt-1 text-xs text-[#6d6860]">
                        {song.isrc} · {song.releaseDate}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${gapTone}`}>{gapScore}% gap</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-[#514d47]">
                    <span>{openGaps ? `${openGaps} streams unregistered` : "Fully optimized"}</span>
                    <span>{readiness}/100 ready</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
