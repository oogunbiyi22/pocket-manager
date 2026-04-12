"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  getSongEstimatedGap,
  getSongGapScore,
  getSongReadinessScore,
} from "@/lib/backstage-data";

export default function ProjectsPage() {
  const { songs } = usePocket();

  return (
    <AppShell title="Songs" eyebrow="Catalog">
      <main className="mx-auto max-w-3xl rounded-[24px] border border-white/10 bg-[#f4f1eb] p-5 text-[#111]">
        <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Song catalog</div>
          <div className="mt-3 text-3xl font-normal tracking-[-0.03em]">Every gap starts with a song.</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Add releases, verify ISRCs, check splits, and see which royalty paths are still leaking money.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition duration-200 ease-out hover:bg-[#e9e4da]"
          >
            Add song
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {songs.map((song) => {
            const gapScore = getSongGapScore(song);
            const readiness = getSongReadinessScore(song);
            const estimatedGap = getSongEstimatedGap(song);

            return (
              <Link
                key={song.id}
                href={`/projects/${song.id}`}
                className="block rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition duration-200 ease-out hover:border-black/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg text-[#111]">{song.title}</div>
                    <div className="mt-1 text-xs text-[#6d6860]">
                      {song.isrc} · {song.releaseDate} · {song.territory}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${gapScoreClass(gapScore)}`}>{gapScore}% gap</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border-[0.5px] border-black/10 bg-[#f4f1eb] px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d6860]">Estimated gap</div>
                    <div className="mt-1 text-[#111]">{formatGapEstimate(estimatedGap)}</div>
                  </div>
                  <div className="rounded-lg border-[0.5px] border-black/10 bg-[#f4f1eb] px-3 py-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d6860]">Readiness</div>
                    <div className="mt-1 text-[#111]">{readiness}/100</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}

function gapScoreClass(score: number) {
  if (score >= 60) return "bg-[#e24b4a]/15 text-[#a32d2d]";
  if (score > 0) return "bg-[#ef9f27]/20 text-[#854f0b]";
  return "bg-[#97c459]/25 text-[#3b6d11]";
}
