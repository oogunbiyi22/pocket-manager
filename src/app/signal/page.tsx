"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const playlistMatches = [
  { name: "Late Night R&B", platform: "Spotify", followers: "284K", fit: 94, note: "Updated weekly" },
  { name: "After Hours Vibes", platform: "Apple Music", followers: "91K", fit: 89, note: "Bi-weekly" },
  { name: "Bedroom Soul", platform: "Spotify", followers: "67K", fit: 86, note: "Open submissions" },
];

const signalAreas = [
  {
    href: "/pitch-kits",
    title: "Pitch kit",
    body: "Create a focused outreach package for playlists, labels, blogs, booking, and sync.",
  },
  {
    href: "/epk",
    title: "EPK",
    body: "Build the living page that makes the artist look ready for serious opportunities.",
  },
  {
    href: "/sync",
    title: "Sync matches",
    body: "Match catalog metadata against active brief-style opportunities.",
  },
  {
    href: "/studio",
    title: "Promo Studio",
    body: "Draft release assets once the Signal generation pipeline is ready.",
  },
];

export default function SignalPage() {
  const { songs } = usePocket();
  const activeSong = songs[0];

  return (
    <AppShell title="Signal" eyebrow="Get heard">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-[#f0efe8] p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Signal</div>
          <div className="mt-3 text-4xl font-light tracking-[-0.03em]">47 pitches sent</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            {activeSong?.title ?? "Your catalog"} · 3 placements this month · package the song, match the target, then send with context.
          </p>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-4 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[15px] font-medium">Pitch {activeSong ? `"${activeSong.title}"` : "a song"}</div>
              <div className="mt-1 text-sm text-white/40">94 matching playlists found</div>
            </div>
            <Link href="/pitch-kits" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0d0d0b]">
              Pitch →
            </Link>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Top matches</div>
          <div className="space-y-3">
            {playlistMatches.map((playlist) => (
              <Link key={playlist.name} href="/pitch-kits" className="block rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[15px] font-medium text-[#111]">{playlist.name}</div>
                    <div className="mt-1 text-xs text-[#6b6b65]">
                      {playlist.platform} · {playlist.followers} followers · {playlist.note}
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eaf3de] px-3 py-1 text-[11px] font-medium text-[#3b6d11]">{playlist.fit}%</span>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/sync" className="mt-4 inline-flex text-sm font-medium text-[#185fa5]">
            See all matches →
          </Link>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {signalAreas.map((area) => (
            <Link key={area.href} href={area.href} className="rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35">
              <div className="text-[15px] font-medium text-[#111]">{area.title}</div>
              <p className="mt-2 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
