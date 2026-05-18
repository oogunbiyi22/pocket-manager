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
      <main className="mx-auto max-w-4xl space-y-4 text-white/90">
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">My catalog</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">Every song gets a Room.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            {summary.totalSongs} songs tracked · {summary.songsWithGaps} need registration work ·{" "}
            {formatGapEstimate(summary.totalEstimatedGap)} estimated Gap
          </p>
          {highestGapSong ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <Link
                href={`/projects/${highestGapSong.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
              >
                <span className="text-white/65">Biggest Room to fix</span>
                <span className="text-right text-white">
                  {highestGapSong.title} · {formatGapEstimate(getSongEstimatedGap(highestGapSong))}
                </span>
              </Link>
              <Link
                href={`/a?prompt=${encodeURIComponent(`What should I do next for \"${highestGapSong.title}\"? Start with the biggest money gap.`)}`}
                className="flex items-center justify-center rounded-xl border border-[#7c6fef]/35 bg-[#7c6fef]/10 px-4 py-3 text-sm font-medium text-[#c7bfff] transition hover:bg-[#7c6fef]/20"
              >
                Ask A about this room →
              </Link>
            </div>
          ) : null}
        </section>

        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Active Rooms</div>
          {songs.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-dashed border-white/12 bg-white/5 p-6 text-center">
              <div className="text-[15px] font-normal text-white/90">No songs yet.</div>
              <p className="mt-2 text-sm text-white/50">Add a release to open your first Room and see the Gap.</p>
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
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">The Vault</div>
            <Link href="/vault" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#f0a832]">
              Open →
            </Link>
          </div>
          {(() => {
            const realAssets = songs.flatMap((song) =>
              (song.assets ?? []).map((a) => ({ ...a, songTitle: song.title, songId: song.id }))
            ).slice(0, 4);
            const kindLabel: Record<string, string> = { master: "M", artwork: "A", split: "S", contract: "C", other: "F" };
            if (realAssets.length > 0) {
              return (
                <div className="overflow-hidden rounded-xl border-[0.5px] border-white/10 bg-white/5">
                  {realAssets.map((file, i, arr) => (
                    <Link
                      key={file.id}
                      href={`/projects/${file.songId}`}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/5 ${i < arr.length - 1 ? "border-b-[0.5px] border-white/8" : ""}`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#0d0d0b]/[0.06] text-[10px] font-medium uppercase text-white/50">
                        {kindLabel[file.kind] ?? "F"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-white/90">{file.name}</span>
                      <span className="shrink-0 text-[11px] text-white/50">{file.songTitle}</span>
                    </Link>
                  ))}
                </div>
              );
            }
            return (
              <div className="rounded-xl border-[0.5px] border-dashed border-white/10 bg-white/5 px-4 py-5 text-center">
                <p className="text-[13px] text-white/50">No files filed yet.</p>
                <Link href="/vault" className="mt-2 inline-block text-xs font-medium text-[#f0a832]">Open vault to file assets →</Link>
              </div>
            );
          })()}
          <p className="mt-2 text-[11px] text-white/50">
            Masters, contracts, split sheets, and artwork live here.
          </p>
        </section>

        {/* Guild entry card */}
        <section className="px-0 py-0">
          <div className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-5 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Guild</div>
            <h3 className="mt-2 text-[22px] font-light tracking-[-0.02em] text-white">
              Your network makes the work move.
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Connect with producers, songwriters, vocalists, and featured artists.
            </p>
            <Link
              href="/guild"
              className="mt-4 inline-flex rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Enter The Guild →
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
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
      className="flex items-center gap-3 rounded-[14px] glass-subtle px-4 py-3 press"
    >
      <ReadinessRing score={readiness} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-white/90">{song.title}</div>
        <div className="mt-0.5 truncate text-[11px] text-white/50">
          {song.releaseDate} · {song.isrc}
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">The Gap</div>
        <div className="mt-1 text-sm text-white/90">{formatGapEstimate(gap)}</div>
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
      ? "bg-[#faeeda] text-[#f0a832]"
      : tone === "complete"
        ? "bg-[#5fcf7e]/10 text-[#5fcf7e]"
        : "glass text-white/90";

  return (
    <div className={`rounded-[18px] card-shadow p-5 ${toneClass}`}>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-2 text-[28px] font-normal leading-none">{value}</div>
    </div>
  );
}

function gapBadgeClass(score: number) {
  if (score === 0) {
    return "bg-[#5fcf7e]/10 text-[#5fcf7e]";
  }

  if (score >= 60) {
    return "bg-[#f05c5c]/10 text-[#f05c5c]";
  }

  return "bg-[#faeeda] text-[#f0a832]";
}
