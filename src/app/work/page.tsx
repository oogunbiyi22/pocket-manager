"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  getRevenueGapSummary,
  getSongEstimatedGap,
  getSongGapScore,
  getSongReadinessScore,
  type SongCatalogItem,
} from "@/lib/backstage-data";

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
  const highestGapSong = [...songs].sort((a, b) => getSongEstimatedGap(b) - getSongEstimatedGap(a))[0];

  return (
    <AppShell title="Work" eyebrow="My catalog">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] text-[#111]">
        <section className="bg-[#0d0d0b] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">My catalog</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">Every song gets a Room.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            {summary.totalSongs} songs tracked · {summary.songsWithGaps} need registration work ·{" "}
            {formatGapEstimate(summary.totalEstimatedGap)} estimated Gap
          </p>
          {highestGapSong ? (
            <Link
              href={`/projects/${highestGapSong.id}`}
              className="mt-5 flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
            >
              <span className="text-white/65">Biggest Room to fix</span>
              <span className="text-right text-white">
                {highestGapSong.title} · {formatGapEstimate(getSongEstimatedGap(highestGapSong))}
              </span>
            </Link>
          ) : null}
        </section>

        <section className="border-b border-black/10 bg-white px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Active Rooms</div>
          <div className="space-y-2">
            {songs.slice(0, 5).map((song) => (
              <RoomRow key={song.id} song={song} />
            ))}
          </div>
        </section>

        <section className="border-b border-black/10 px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Work surfaces</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {workAreas.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35"
              >
                <div className="text-[14px] font-medium text-[#111]">{area.title}</div>
                <p className="mt-2 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 px-5 py-5 sm:grid-cols-3">
          <WorkMetric label="Catalog Gap" value={formatGapEstimate(summary.totalEstimatedGap)} tone="warning" />
          <WorkMetric label="Rooms open" value={`${summary.totalSongs}`} tone="neutral" />
          <WorkMetric label="Income paths" value={`${summary.activeIncomeStreams}`} tone="complete" />
        </section>
      </main>
    </AppShell>
  );
}

function RoomRow({ song }: { song: SongCatalogItem }) {
  const readiness = getSongReadinessScore(song);
  const gap = getSongEstimatedGap(song);
  const gapScore = getSongGapScore(song);
  const missingCount = song.revenueStreams.filter((stream) => stream.estimatedGap > 0).length;

  return (
    <Link
      href={`/projects/${song.id}`}
      className="flex items-center gap-3 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] px-4 py-3 transition hover:border-black/35"
    >
      <ReadinessRing score={readiness} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-[#111]">{song.title}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6b6b65]">
          {song.releaseDate} · {song.isrc}
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a9a8a]">The Gap</div>
        <div className="mt-1 text-sm text-[#111]">{formatGapEstimate(gap)}</div>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${gapBadgeClass(gapScore)}`}>
        {missingCount ? `${missingCount} missing` : "Ready"}
      </span>
    </Link>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const fill = (score / 100) * circumference;
  const color = score === 100 ? "#3b6d11" : score > 40 ? "#854f0b" : "#a32d2d";

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
      <circle
        cx="28"
        cy="28"
        r={radius}
        fill="none"
        stroke={color}
        strokeDasharray={`${fill} ${circumference}`}
        strokeLinecap="round"
        strokeWidth="3"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="28" dominantBaseline="central" fill={color} fontSize="15" fontWeight="500" textAnchor="middle">
        {score}
      </text>
    </svg>
  );
}

function WorkMetric({ label, value, tone }: { label: string; value: string; tone: "warning" | "complete" | "neutral" }) {
  const toneClass =
    tone === "warning"
      ? "bg-[#faeeda] text-[#854f0b]"
      : tone === "complete"
        ? "bg-[#eaf3de] text-[#3b6d11]"
        : "bg-white text-[#111]";

  return (
    <div className={`rounded-xl border-[0.5px] border-black/15 p-4 ${toneClass}`}>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-2 text-[28px] font-normal leading-none">{value}</div>
    </div>
  );
}

function gapBadgeClass(score: number) {
  if (score === 0) {
    return "bg-[#eaf3de] text-[#3b6d11]";
  }

  if (score >= 60) {
    return "bg-[#fcebeb] text-[#a32d2d]";
  }

  return "bg-[#faeeda] text-[#854f0b]";
}
