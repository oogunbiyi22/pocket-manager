"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary } from "@/lib/backstage-data";

export default function APage() {
  const { songs, profile } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
  const topSong = songs[0];

  return (
    <AppShell title="A" eyebrow="Manager">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">A</div>
          <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Your manager is watching the Gap.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            {profile.artistName}, your catalog has {formatGapEstimate(summary.totalEstimatedGap)} estimated missing across {summary.songsWithGaps} songs.
          </p>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">First message</div>
          <p className="mt-3 text-sm leading-6 text-[#111]">
            Your highest-value move is {nextAction.title}. It is worth about {formatGapEstimate(nextAction.estimatedValue)} and should take {nextAction.estimatedTime}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/projects/${nextAction.songId}`} className="rounded-lg bg-[#0d0d0b] px-4 py-2 text-sm text-white">
              Start now
            </Link>
            <Link href="/actions" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
              See queue
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#854f0b]">
          Full Claude streaming chat is Phase 12. This clickable placeholder keeps A present in the product now while the core catalog, Gap, and action systems continue moving.
        </section>

        {topSong ? (
          <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Ask next</div>
            <div className="mt-3 grid gap-2 text-sm">
              <Link href={`/projects/${topSong.id}`} className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-3 text-[#111]">
                What am I missing on {topSong.title}?
              </Link>
              <Link href="/harvest" className="rounded-lg border-[0.5px] border-black/15 bg-white px-3 py-3 text-[#111]">
                Which money path should I fix first?
              </Link>
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
