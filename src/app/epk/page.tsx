"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getRevenueGapSummary,
  getSongConfirmedIncome,
  getSongReadinessScore,
} from "@/lib/backstage-data";

export default function EpkPage() {
  const { profile, songs } = usePocket();
  const [selectedSongIds, setSelectedSongIds] = useState(() => songs.slice(0, 3).map((song) => song.id));
  const [artistBio, setArtistBio] = useState(
    `${profile.artistName} is building a release catalog with Pocket Manager, tracking revenue readiness, platform registration, and the next money moves across every song.`,
  );
  const [contact, setContact] = useState("booking@pocketmanager.app");
  const selectedSongs = useMemo(
    () => songs.filter((song) => selectedSongIds.includes(song.id)),
    [selectedSongIds, songs],
  );
  const summary = getRevenueGapSummary(selectedSongs.length ? selectedSongs : songs);

  function toggleSong(songId: string) {
    setSelectedSongIds((current) =>
      current.includes(songId) ? current.filter((id) => id !== songId) : [...current, songId],
    );
  }

  return (
    <AppShell title="EPK" eyebrow="Living page">
      <main className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] text-[#111]">
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Electronic press kit</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">Package the catalog for the room you want in.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            One living page for curators, labels, booking, sync, and partners. It pulls the catalog, readiness, and income proof into one professional surface.
          </p>
        </section>

        <section className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Builder</div>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Artist bio</span>
                <textarea
                  value={artistBio}
                  onChange={(event) => setArtistBio(event.target.value)}
                  className="min-h-36 w-full rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3 text-sm leading-6 outline-none"
                />
              </label>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Contact</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm outline-none"
                />
              </label>
            </div>

            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Songs included</div>
              <div className="mt-3 space-y-2">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => toggleSong(song.id)}
                    className={`flex w-full items-center justify-between rounded-lg border-[0.5px] px-3 py-3 text-left text-sm ${
                      selectedSongIds.includes(song.id) ? "border-black/25 bg-[#0a0a0a] text-white" : "border-black/15 bg-white text-[#111]"
                    }`}
                  >
                    <span>{song.title}</span>
                    <span>{getSongReadinessScore(song)}/100</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
            <div className="bg-[#0a0a0a] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Public page preview</div>
              <h3 className="mt-4 text-[40px] font-light leading-none tracking-[-0.03em] text-white">{profile.artistName}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">{artistBio}</p>
              <div className="mt-4 text-sm text-white/45">{contact}</div>
            </div>

            <div className="grid gap-3 border-b-[0.5px] border-black/10 p-5 sm:grid-cols-3">
              <EpkMetric label="Songs" value={`${selectedSongs.length || songs.length}`} />
              <EpkMetric label="Confirmed" value={formatMoney(summary.totalSecured)} />
              <EpkMetric label="Missing" value={formatGapEstimate(summary.totalEstimatedGap)} />
            </div>

            <div className="space-y-3 p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Catalog</div>
              {(selectedSongs.length ? selectedSongs : songs).map((song) => (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="block rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-normal text-[#111]">{song.title}</div>
                      <div className="mt-1 text-xs text-[#6b6b65]">
                        {song.releaseDate} · {song.genre ?? "Genre needed"} · {song.mood ?? "Mood needed"}
                      </div>
                    </div>
                    <span className="rounded-full bg-[#eaf3de] px-3 py-1 text-[11px] font-medium text-[#3b6d11]">
                      {getSongReadinessScore(song)}/100
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#514d47]">
                    Confirmed income: {formatMoney(getSongConfirmedIncome(song))}. Readiness and registration proof are ready before the pitch goes out.
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 border-t-[0.5px] border-black/10 p-5">
              <button type="button" className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white">
                Copy EPK link
              </button>
              <Link href="/pitch-kits" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111]">
                Build pitch
              </Link>
              <Link href="/signal" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111]">
                Back to Signal
              </Link>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function EpkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b6b65]">{label}</div>
      <div className="mt-2 text-xl font-normal text-[#111]">{value}</div>
    </div>
  );
}
