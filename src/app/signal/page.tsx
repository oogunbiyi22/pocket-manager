"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const playlistMatches = [
  { name: "Late Night R&B", platform: "Spotify", followers: "284K", fit: 94, note: "Updated weekly" },
  { name: "After Hours Vibes", platform: "Apple Music", followers: "91K", fit: 89, note: "Bi-weekly" },
  { name: "Bedroom Soul", platform: "Spotify", followers: "67K", fit: 86, note: "Open submissions" },
];

export default function SignalPage() {
  const { songs, profile } = usePocket();
  const activeSong = songs[0];
  const totalStreams = songs.reduce((t, s) => t + s.streams, 0);
  const monthlyStreams = Math.round(totalStreams / 12);

  return (
    <AppShell title="Signal" eyebrow="Get heard">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f0efe8] text-[#111]">

        {/* Command surface */}
        <section className="bg-[#0d0d0b] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Signal</div>
          <div className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">47 pitches sent</div>
          <p className="mt-3 text-sm text-white/45">
            3 placements this month · {activeSong ? `"${activeSong.title}" is your active record` : "Start by adding a song"}
          </p>
        </section>

        {/* Pitch this song */}
        <section className="border-b border-black/10 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[15px] font-medium text-[#111]">
                Pitch {activeSong ? `"${activeSong.title}"` : "a song"}
              </div>
              <div className="mt-1 text-sm text-[#6b6b65]">94 matching playlists found</div>
            </div>
            <Link
              href="/pitch-kits"
              className="shrink-0 rounded-lg bg-[#0d0d0b] px-4 py-2 text-sm font-medium text-white"
            >
              Pitch →
            </Link>
          </div>
        </section>

        {/* Playlist matches */}
        <section className="px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Top matches</div>
          <div className="space-y-2">
            {playlistMatches.map((playlist) => (
              <Link
                key={playlist.name}
                href="/pitch-kits"
                className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3 transition hover:border-black/35"
              >
                <div>
                  <div className="text-[14px] font-medium text-[#111]">{playlist.name}</div>
                  <div className="mt-0.5 text-[11px] text-[#6b6b65]">
                    {playlist.platform} · {playlist.followers} followers · {playlist.note}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#eaf3de] px-3 py-1 text-[11px] font-medium text-[#3b6d11]">
                  {playlist.fit}%
                </span>
              </Link>
            ))}
          </div>
          <Link href="/sync" className="mt-3 inline-flex text-sm text-[#854f0b]">
            See all matches →
          </Link>
        </section>

        {/* EPK card */}
        <section className="border-t border-black/10 px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">EPK</div>
          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
            <div className="bg-[#0d0d0b] px-5 py-5 text-white">
              <div className="text-[18px] font-light tracking-tight">{profile.artistName}</div>
              <div className="mt-1 text-sm text-white/45">{profile.vibe || profile.role || "Independent artist"}</div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">Streams</div>
                  <div className="mt-1 font-normal text-white">{(totalStreams / 1000).toFixed(0)}K</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">Monthly</div>
                  <div className="mt-1 font-normal text-white">{(monthlyStreams / 1000).toFixed(0)}K</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">Releases</div>
                  <div className="mt-1 font-normal text-white">{songs.length}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">Playlists</div>
                  <div className="mt-1 font-normal text-white">3</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <p className="text-sm text-[#6b6b65]">Complete the EPK to share with curators, labels, and booking.</p>
              <Link href="/epk" className="shrink-0 rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111] transition hover:bg-[#f5f4f0]">
                Share EPK link
              </Link>
            </div>
          </div>
        </section>

        {/* Sync opportunities */}
        <section className="border-t border-black/10 px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Sync opportunities</div>
          <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
            <div className="text-[14px] font-medium text-[#111]">Sync licensing</div>
            <p className="mt-1.5 text-sm leading-6 text-[#6b6b65]">
              Match your catalog against active briefs and licensing opportunities.
            </p>
            <Link href="/sync" className="mt-3 inline-flex rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111] transition hover:bg-[#f5f4f0]">
              Browse matches →
            </Link>
          </div>
        </section>

        {/* More Signal tools */}
        <section className="border-t border-black/10 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/pitch-kits", title: "Pitch kit", body: "Create focused outreach packages for playlists, labels, blogs, and sync." },
              { href: "/studio", title: "Promo Studio", body: "Draft release assets for social, email, and curator pitches." },
            ].map((area) => (
              <Link key={area.href} href={area.href} className="rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35">
                <div className="text-[14px] font-medium text-[#111]">{area.title}</div>
                <p className="mt-1.5 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
