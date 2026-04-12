"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getRevenueGapSummary } from "@/lib/backstage-data";

const workAreas = [
  {
    href: "/projects",
    title: "Songs",
    body: "Open the catalog and step into each song's Room.",
  },
  {
    href: "/albums",
    title: "EPs and albums",
    body: "Group tracks into a release package with combined readiness.",
  },
  {
    href: "/radar",
    title: "The Runway",
    body: "Check the release countdown and the next checkpoint.",
  },
  {
    href: "/vault",
    title: "The Vault",
    body: "Keep files, statements, contracts, and creative memory organized.",
  },
  {
    href: "/guild",
    title: "The Guild",
    body: "Find collaborators and turn accepted connections into shared Rooms.",
  },
];

export default function WorkPage() {
  const { songs } = usePocket();
  const summary = getRevenueGapSummary(songs);

  return (
    <AppShell title="Work" eyebrow="My catalog">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">My catalog</div>
          <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Every song gets a Room.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            {summary.totalSongs} songs tracked · {summary.songsWithGaps} need registration work · {formatGapEstimate(summary.totalEstimatedGap)} estimated Gap.
          </p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {workAreas.map((area) => (
            <Link key={area.href} href={area.href} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35">
              <div className="text-[15px] font-medium text-[#111]">{area.title}</div>
              <p className="mt-2 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
            </Link>
          ))}
        </section>

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Active rooms</div>
          <div className="space-y-3">
            {songs.slice(0, 4).map((song) => (
              <Link key={song.id} href={`/projects/${song.id}`} className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 text-sm transition hover:border-black/35">
                <div>
                  <div className="text-[15px] font-medium text-[#111]">{song.title}</div>
                  <div className="mt-1 text-xs text-[#6b6b65]">{song.releaseDate} · {song.isrc}</div>
                </div>
                <span className="rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#854f0b]">Open Room</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
