"use client";

import Link from "next/link";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  getCatalogReadinessScore,
  getRevenueActionQueue,
  getRevenueGapSummary,
  getSongReadinessScore,
  type SongCatalogItem,
} from "@/lib/backstage-data";

function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / 24;
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(Math.round(start));
      if (start >= target) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, [target]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function ReadinessRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e8e7e2" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="500" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function missingAssetCount(songs: SongCatalogItem[]): number {
  return songs.reduce((acc, song) => {
    let missing = 0;
    if (!song.isrc) missing++;
    if (!song.releaseDate) missing++;
    if (!(song.collaborators?.length)) missing++;
    return acc + missing;
  }, 0);
}

export default function MobilePage() {
  const { songs, profile, signedIn } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const catalogReadiness = getCatalogReadinessScore(songs);
  const [clearedActions] = useState<string[]>([]);

  const availableSongs = useMemo(
    () =>
      songs
        .map((song) => ({
          ...song,
          revenueStreams: song.revenueStreams.filter(
            (stream) => !clearedActions.includes(`${song.id}-${stream.streamType}-${stream.collectionBody}`),
          ),
        }))
        .filter((song) => song.revenueStreams.length > 0),
    [clearedActions, songs],
  );

  const actionQueue = getRevenueActionQueue(availableSongs.length ? availableSongs : songs).slice(0, 3);
  const missingAssets = missingAssetCount(songs);
  const activeSong = songs[0] ?? null;

  // Manager brief: context-aware note based on real state
  const managerBrief = useMemo(() => {
    if (songs.length === 0) return "Add your first release and I'll scan every revenue path — gaps, missing registrations, and next moves.";
    if (summary.totalEstimatedGap > 0 && actionQueue[0]) {
      return `${summary.songsWithGaps} song${summary.songsWithGaps === 1 ? "" : "s"} with open gaps. Biggest move: ${actionQueue[0].action} via ${actionQueue[0].collectionBody} — about ${formatGapEstimate(actionQueue[0].estimatedValue)}.`;
    }
    if (missingAssets > 0) return `${missingAssets} asset${missingAssets === 1 ? "" : "s"} missing from your vault. Cover art, split sheets, and masters protect your catalog.`;
    return `Catalog looks clean — ${songs.length} track${songs.length === 1 ? "" : "s"} tracked. No open gaps detected right now.`;
  }, [songs, summary, actionQueue, missingAssets]);

  return (
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-md space-y-4 text-[#111]">

        {/* Top row */}
        <header className="flex items-center justify-between px-1 pt-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5d5a54]">Pocket Manager</div>
            <div className="text-[15px] text-[#111]">Your situation</div>
          </div>
          {signedIn ? (
            <Link
              href="/settings"
              className="grid size-10 place-items-center rounded-full border border-black/10 bg-white text-sm font-medium text-[#111]"
              aria-label="Open profile"
            >
              {profile.artistName?.[0]?.toUpperCase() ?? "A"}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-medium text-[#111]"
            >
              Sign in
            </Link>
          )}
        </header>

        {/* Manager brief — always visible at top */}
        <section className="overflow-hidden rounded-[20px] glass-dark card-shadow-dark">
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">A · Manager brief</div>
              <p className="mt-2 text-sm leading-7 text-white/80">{managerBrief}</p>
            </div>
          </div>
          <div className="border-t border-white/[0.08] px-5 py-3 flex items-center justify-between">
            <Link href="/a" className="text-xs font-medium text-white/40 hover:text-white/70 transition">
              Ask A anything →
            </Link>
            {missingAssets > 0 && (
              <Link href="/vault" className="text-[10px] font-medium text-[#e24b4a]/70 hover:text-[#e24b4a] transition">
                {missingAssets} missing in vault
              </Link>
            )}
          </div>
        </section>

        {/* Command surface — total secured + readiness */}
        <section className="overflow-hidden rounded-[24px] glass-dark px-5 py-6 text-white card-shadow-dark">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Total secured</div>
          <div className="mt-3 text-[44px] font-light leading-none tracking-[-0.04em]">
            $<CountUp target={summary.totalSecured} />
          </div>
          <div className="mt-3 text-sm text-white/45">
            This quarter · {summary.activeIncomeStreams} stream{summary.activeIncomeStreams === 1 ? "" : "s"} active
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${catalogReadiness}%`,
                    backgroundColor: catalogReadiness >= 70 ? "#97c459" : catalogReadiness >= 40 ? "#ef9f27" : "#e24b4a",
                  }}
                />
              </div>
            </div>
            <span className="shrink-0 text-[11px] text-white/40">
              {catalogReadiness}% ready
            </span>
          </div>
        </section>

        {/* Gap strip */}
        {songs.length > 0 && summary.totalEstimatedGap > 0 && (
          <Link
            href="/harvest"
            className="flex items-center justify-between gap-3 rounded-[18px] bg-[#faeeda] px-5 py-4 press card-shadow"
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#854f0b]/60">The Gap</div>
              <span className="text-sm font-medium text-[#854f0b]">
                {formatGapEstimate(summary.totalEstimatedGap)} uncollected · {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"}
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-[#854f0b] px-3 py-1 text-[11px] font-semibold text-white">Fix →</span>
          </Link>
        )}

        {/* Top 3 priorities */}
        {actionQueue.length > 0 && (
          <section className="rounded-[20px] glass p-5 card-shadow">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Top priorities</div>
              <Link href="/a" className="text-[11px] font-medium text-[var(--amber)]">Ask A →</Link>
            </div>
            <div className="space-y-2">
              {actionQueue.map((action, i) => (
                <Link
                  key={i}
                  href={action.songId ? `/projects/${action.songId}` : "/harvest"}
                  className="flex items-start gap-3 rounded-[14px] glass-subtle px-4 py-3 press"
                >
                  <span className="shrink-0 mt-0.5 text-[11px] font-bold text-[#9a9a8a]">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{action.action} · {action.collectionBody}</div>
                    {action.songTitle && <div className="text-[11px] text-[#9a9a8a] mt-0.5">{action.songTitle}</div>}
                  </div>
                  {action.estimatedValue > 0 && (
                    <span className="shrink-0 rounded-full bg-[#faeeda] px-2.5 py-1 text-[10px] font-semibold text-[#854f0b]">
                      {formatGapEstimate(action.estimatedValue)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Active project */}
        {activeSong ? (
          <section className="rounded-[20px] glass p-5 card-shadow">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Active release</div>
            <Link
              href={`/projects/${activeSong.id}`}
              className="flex items-center gap-4 rounded-[14px] glass-subtle px-4 py-4 press"
            >
              <ReadinessRing score={getSongReadinessScore(activeSong)} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-[var(--text-primary)] truncate">{activeSong.title}</div>
                <div className="text-[11px] text-[#9a9a8a] mt-0.5">
                  {activeSong.releaseDate ? `Released ${activeSong.releaseDate}` : "Release date not set"}
                </div>
              </div>
              <span className="text-[#9a9a8a] text-sm">→</span>
            </Link>
            <Link
              href="/work"
              className="mt-2 block text-center text-[11px] text-[#9a9a8a] hover:text-[#111] transition py-2"
            >
              View all releases →
            </Link>
          </section>
        ) : (
          <section className="rounded-[20px] glass p-5 card-shadow">
            <div className="py-2 text-center">
              <div className="text-3xl">🎵</div>
              <div className="mt-3 text-[15px] font-medium text-[var(--text-primary)]">Add your first release</div>
              <p className="mt-2 text-sm leading-6 text-[#9a9a8a]">
                Once you add a song, Pocket Manager scans every revenue path and shows you exactly what to fix.
              </p>
              <Link
                href="/projects/new"
                className="mt-5 block rounded-xl bg-[var(--bg-dark)] px-4 py-3.5 text-center text-sm font-medium text-white press"
              >
                Add release →
              </Link>
            </div>
          </section>
        )}

        {/* Catalog — compact */}
        {songs.length > 1 && (
          <section className="rounded-[20px] glass p-5 card-shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Catalog
              </div>
              <Link href="/work" className="text-[11px] font-medium text-[var(--amber)]">
                {songs.length} songs →
              </Link>
            </div>
            <div className="space-y-2">
              {songs.slice(1, 4).map((song) => {
                const readiness = getSongReadinessScore(song);
                return (
                  <Link
                    key={song.id}
                    href={`/projects/${song.id}`}
                    className="flex items-center gap-3 rounded-[14px] glass-subtle px-4 py-3 press"
                  >
                    <ReadinessRing score={readiness} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] text-[var(--text-primary)]">{song.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#9a9a8a]">{song.isrc ?? "No ISRC"}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </AppShell>
  );
}
