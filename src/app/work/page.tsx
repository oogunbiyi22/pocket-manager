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
          {songs.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-dashed border-black/20 bg-[#f8f6f1] p-6 text-center">
              <div className="text-[15px] font-normal text-[#111]">No songs yet.</div>
              <p className="mt-2 text-sm text-[#6b6b65]">Add a release to open your first Room and see the Gap.</p>
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-5 py-2.5 text-sm font-medium text-white"
              >
                Add first song →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.slice(0, 5).map((song) => (
                <RoomRow key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>

        {/* The Vault preview */}
        <section className="border-b border-black/10 bg-white px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">The Vault</div>
            <Link href="/vault" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#854f0b]">
              Open →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0]">
            {songs.slice(0, 3).flatMap((song) => [
              { key: `${song.id}-master`, name: `${song.title} — master WAV`, type: "Master", songTitle: song.title },
              { key: `${song.id}-split`, name: `${song.title} — split sheet`, type: "Split", songTitle: song.title },
            ]).slice(0, 4).map((file, i, arr) => (
              <Link
                key={file.key}
                href="/vault"
                className={`flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-black/[0.03] ${i < arr.length - 1 ? "border-b-[0.5px] border-black/10" : ""}`}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#0d0d0b]/[0.06] text-[10px] font-medium uppercase text-[#6b6b65]">
                  {file.type === "Master" ? "M" : "S"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[#111]">{file.name}</span>
                <span className="shrink-0 text-[11px] text-[#9a9a8a]">{file.type}</span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#9a9a8a]">
            Masters, contracts, split sheets, and artwork live here.
          </p>
        </section>

        {/* Guild entry card */}
        <section className="border-b border-black/10 px-5 py-5">
          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] px-5 py-5 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Guild</div>
            <h3 className="mt-2 text-[22px] font-light tracking-[-0.02em] text-white">
              Your network makes the work move.
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/45">
              6 matches waiting · producers, songwriters, vocalists, featured artists
            </p>
            <div className="mt-4 flex -space-x-2">
              {[
                { initials: "NK", bg: "#cecbf6", fg: "#3c3489" },
                { initials: "RM", bg: "#9fe1cb", fg: "#085041" },
                { initials: "AJ", bg: "#f4c0d1", fg: "#72243e" },
                { initials: "LM", bg: "#cecbf6", fg: "#3c3489" },
              ].map((avatar) => (
                <span
                  key={avatar.initials}
                  style={{ backgroundColor: avatar.bg, color: avatar.fg }}
                  className="grid size-8 place-items-center rounded-full border-2 border-[#0d0d0b] text-[10px] font-semibold"
                >
                  {avatar.initials}
                </span>
              ))}
              <span className="grid size-8 place-items-center rounded-full border-2 border-[#0d0d0b] bg-white/10 text-[10px] text-white/55">
                +2
              </span>
            </div>
            <Link
              href="/guild"
              className="mt-4 inline-flex rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Enter The Guild →
            </Link>
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
