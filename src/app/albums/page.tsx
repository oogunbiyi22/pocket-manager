"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getSongEstimatedGap, getSongReadinessScore } from "@/lib/backstage-data";

export default function AlbumsPage() {
  const { songs } = usePocket();
  const [title, setTitle] = useState("Untitled EP");
  const [upc, setUpc] = useState("");
  const [releaseDate, setReleaseDate] = useState(songs[0]?.releaseDate ?? "");
  const [selectedSongIds, setSelectedSongIds] = useState(() => songs.slice(0, 4).map((song) => song.id));
  const selectedSongs = useMemo(() => songs.filter((song) => selectedSongIds.includes(song.id)), [selectedSongIds, songs]);
  const totalGap = selectedSongs.reduce((total, song) => total + getSongEstimatedGap(song), 0);
  const averageReadiness = selectedSongs.length
    ? Math.round(selectedSongs.reduce((total, song) => total + getSongReadinessScore(song), 0) / selectedSongs.length)
    : 0;
  const missingItems = selectedSongs.flatMap((song) => {
    const items = [];

    if (!song.isrc) items.push(`${song.title}: ISRC needed`);
    if (!song.metadataComplete) items.push(`${song.title}: metadata incomplete`);
    if (!song.artworkUploaded) items.push(`${song.title}: artwork needed`);
    if (!song.splitSheetSigned) items.push(`${song.title}: split sheet unsigned`);
    if (getSongEstimatedGap(song) > 0) items.push(`${song.title}: revenue gaps open`);

    return items;
  });

  function toggleSong(songId: string) {
    setSelectedSongIds((current) =>
      current.includes(songId) ? current.filter((id) => id !== songId) : [...current, songId],
    );
  }

  return (
    <AppShell title="EP / Album Builder" eyebrow="Release package">
      <main className="mx-auto max-w-5xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Release package</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Bundle your songs into an EP or album and see every gap before you release.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Select songs from your catalog, set release details, and get a readiness checklist — ISRC, metadata, artwork, splits, and revenue gaps all in one view.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Release details</div>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                />
              </label>
              <label className="mt-3 block text-sm text-[#514d47]">
                <span className="mb-2 block">UPC</span>
                <input
                  value={upc}
                  onChange={(event) => setUpc(event.target.value)}
                  placeholder="Needed before distribution"
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                />
              </label>
              <label className="mt-3 block text-sm text-[#514d47]">
                <span className="mb-2 block">Release date</span>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(event) => setReleaseDate(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                />
              </label>
            </div>

            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Tracks</div>
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

          <div className="rounded-xl border-[0.5px] border-black/15 bg-[#fafaf8] p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Release preview</div>
            <div className="mt-4 border-b-[0.5px] border-black/15 pb-4">
              <h3 className="text-4xl font-normal tracking-[-0.03em] text-[#111]">{title || "Untitled release"}</h3>
              <p className="mt-2 text-sm text-[#6b6b65]">
                {selectedSongs.length} track{selectedSongs.length === 1 ? "" : "s"} · {releaseDate || "Release date needed"} · UPC {upc || "needed"}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Readiness" value={`${averageReadiness}/100`} />
              <Metric label="Estimated gap" value={formatGapEstimate(totalGap)} />
              <Metric label="Missing" value={`${missingItems.length}`} />
            </div>

            <div className="mt-5 space-y-3">
              {selectedSongs.map((song, index) => (
                <Link key={song.id} href={`/projects/${song.id}`} className="block rounded-xl border-[0.5px] border-black/15 bg-white p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[#111]">{index + 1}. {song.title}</div>
                      <div className="mt-1 text-xs text-[#6b6b65]">{song.isrc || "ISRC needed"} · {song.releaseDate}</div>
                    </div>
                    <span className="rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#854f0b]">
                      {formatGapEstimate(getSongEstimatedGap(song))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">What is missing</div>
              <div className="mt-3 space-y-2 text-sm text-[#514d47]">
                {missingItems.length ? missingItems.slice(0, 8).map((item) => <div key={item}>{item}</div>) : <div>This release package is clean in the prototype checklist.</div>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b6b65]">{label}</div>
      <div className="mt-2 text-xl font-normal text-[#111]">{value}</div>
    </div>
  );
}
