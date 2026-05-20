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
    <AppShell title="Rooms" eyebrow="Core workflow">
      <main className="mx-auto max-w-3xl rounded-[24px] border border-white/10 bg-white/5 p-5 text-white/90">
        <div className="rounded-xl border-[0.5px] border-white/10 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Release rooms</div>
          <div className="mt-3 text-3xl font-normal tracking-[-0.03em]">Every release gets one focused room.</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            This is the core path: add the release, fix what is missing, file the assets, and follow the next best move.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white/90 transition duration-200 ease-out hover:bg-white/20"
          >
            Add first release
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {songs.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-dashed border-white/12 bg-white/[0.04] p-6 text-center">
              <div className="text-lg text-white/90">No rooms yet.</div>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Add one release and Pocket Manager will open the room, score readiness, and show the money gaps to fix first.
              </p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white/90 transition duration-200 ease-out hover:bg-white/20"
              >
                Open my first room →
              </Link>
            </div>
          ) : (
            songs.map((song) => {
              const gapScore = getSongGapScore(song);
              const readiness = getSongReadinessScore(song);
              const estimatedGap = getSongEstimatedGap(song);

              return (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="block rounded-xl border-[0.5px] border-white/10 bg-white/[0.06] p-4 transition duration-200 ease-out hover:border-white/20 hover:bg-white/[0.09]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg text-white/90">{song.title}</div>
                      <div className="mt-1 text-xs text-[#6d6860]">
                        {song.isrc} · {song.releaseDate} · {song.territory}
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${gapScoreClass(gapScore)}`}>{gapScore}% gap</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border-[0.5px] border-white/8 bg-white/[0.04] px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Estimated gap</div>
                      <div className="mt-1 text-white/90">{formatGapEstimate(estimatedGap)}</div>
                    </div>
                    <div className="rounded-lg border-[0.5px] border-white/8 bg-white/[0.04] px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Readiness</div>
                      <div className="mt-1 text-white/90">{readiness}/100</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </AppShell>
  );
}

function gapScoreClass(score: number) {
  if (score >= 60) return "bg-[#e24b4a]/15 text-[#f05c5c]";
  if (score > 0) return "bg-[#ef9f27]/20 text-[#f0a832]";
  return "bg-[#97c459]/25 text-[#5fcf7e]";
}
