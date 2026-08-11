"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getNextReleaseRadarCheckpoint, getReleaseRadar } from "@/lib/backstage-data";

export default function RadarPage() {
  const { songs } = usePocket();
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? "");
  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? songs[0];
  const checkpoints = useMemo(() => (selectedSong ? getReleaseRadar(selectedSong) : []), [selectedSong]);
  const nextCheckpoint = selectedSong ? getNextReleaseRadarCheckpoint(selectedSong) : null;

  return (
    <AppShell title="Release Radar" eyebrow="Release countdown">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-white/[0.08] bg-[#141412] p-5 text-white/90">
        <section className="rounded-xl border-[0.5px] border-white/[0.08] bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Release countdown</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Know exactly what needs to happen before the song drops.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Milestones are calculated from your release date — registration, metadata, promo, and distribution checks timed automatically.
          </p>
        </section>

        {songs.length === 0 && (
          <section className="mt-5 rounded-xl border-[0.5px] border-dashed border-white/10 bg-white/[0.05] p-6 text-center text-sm text-white/50">
            <div className="text-2xl">📡</div>
            <div className="mt-2 font-medium text-white/85">No releases yet</div>
            <p className="mt-1">Add a release with a date and the radar builds itself.</p>
            <Link href="/projects/new" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
              Add release →
            </Link>
          </section>
        )}

        {songs.length > 0 && (
          <>
            <section className="mt-5 rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Active release</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => setSelectedSongId(song.id)}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      selectedSong?.id === song.id ? "bg-[#7c6fef] text-white" : "border-[0.5px] border-white/[0.08] bg-white/[0.06] text-white/85"
                    }`}
                  >
                    {song.title}
                  </button>
                ))}
              </div>
            </section>

            {selectedSong && (
              <>
                <section className="mt-5 rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Next checkpoint</div>
                      <h3 className="mt-2 text-2xl font-normal text-white/85">{nextCheckpoint?.title ?? "Add a release date"}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                        {nextCheckpoint?.detail ?? "A release date is required before Pocket can build the countdown."}
                      </p>
                    </div>
                    <div className="rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.06] px-4 py-3 text-sm">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#6d6860]">Target</div>
                      <div className="mt-1 text-white/85">{nextCheckpoint?.targetDate ?? selectedSong.releaseDate}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/projects/${selectedSong.id}`} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                      Open song room
                    </Link>
                    <Link href="/notifications" className="rounded-lg border-[0.5px] border-white/[0.08] px-4 py-2 text-sm text-white/85">
                      Notification settings
                    </Link>
                  </div>
                </section>

                <section className="mt-5">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Milestones</div>
                  <div className="space-y-3">
                    {checkpoints.map((checkpoint) => (
                      <article key={`${checkpoint.daysBefore}-${checkpoint.title}`} className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[15px] font-medium text-white/85">{checkpoint.title}</div>
                            <p className="mt-2 text-sm leading-6 text-white/60">{checkpoint.detail}</p>
                            <div className="mt-2 text-xs text-white/50">{checkpoint.targetDate}</div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${statusClass(checkpoint.status)}`}>
                            {checkpoint.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

function statusClass(status: string) {
  if (status === "Due now") {
    return "bg-[#faeeda] text-[#ef9f27]";
  }

  if (status === "Missed") {
    return "bg-[#f05c5c]/10 text-[#f05c5c]";
  }

  return "bg-[#e6f1fb] text-[#185fa5]";
}
