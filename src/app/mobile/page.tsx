"use client";

import Link from "next/link";

import { useMemo, useState } from "react";
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

function ReadinessRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
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
  const activeSong = [...songs].sort((a, b) => getSongReadinessScore(a) - getSongReadinessScore(b))[0] ?? null;
  const activeSongReadiness = activeSong ? getSongReadinessScore(activeSong) : null;
  const primaryActionHref = activeSong ? `/projects/${activeSong.id}` : "/projects/new";
  const primaryActionLabel = activeSong ? "Open urgent room →" : "Add first release →";

  // Manager brief: context-aware note based on real state
  const managerBrief = useMemo(() => {
    if (songs.length === 0) return "Add your first release and Pocket Manager scans every revenue path automatically — gaps, missing registrations, and next moves.";
    if (summary.totalEstimatedGap > 0 && actionQueue[0]) {
      return `${summary.songsWithGaps} song${summary.songsWithGaps === 1 ? "" : "s"} with open gaps. Biggest move: ${actionQueue[0].action} via ${actionQueue[0].collectionBody} — about ${formatGapEstimate(actionQueue[0].estimatedValue)}.`;
    }
    if (missingAssets > 0) return `${missingAssets} asset${missingAssets === 1 ? "" : "s"} missing from your vault. Cover art, split sheets, and masters protect your catalog.`;
    return `Catalog looks clean — ${songs.length} track${songs.length === 1 ? "" : "s"} tracked. No open gaps detected right now.`;
  }, [songs, summary, actionQueue, missingAssets]);

  return (
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-md space-y-4 text-white/90">

        {/* Top row */}
        <header className="flex items-center justify-between px-1 pt-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Pocket Manager</div>
            <div className="text-[15px] text-white/90">Your situation</div>
          </div>
          {signedIn ? (
            <Link
              href="/settings"
              className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-sm font-medium text-white/90"
              aria-label="Open profile"
            >
              {profile.artistName?.[0]?.toUpperCase() ?? "A"}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90"
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
          <div className="grid grid-cols-3 gap-2 border-t border-white/[0.08] px-5 py-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Rooms</div>
              <div className="mt-1 text-sm text-white/85">{songs.length}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Gap</div>
              <div className="mt-1 text-sm text-white/85">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/30">Missing</div>
              {missingAssets > 0 ? (
                <Link href="/vault" className={`mt-1 block text-sm text-[#ef9f27] underline-offset-2 hover:underline`}>{missingAssets}</Link>
              ) : (
                <div className="mt-1 text-sm text-white/85">{missingAssets}</div>
              )}
            </div>
          </div>
        </section>

        {/* Command surface — total secured + readiness */}
        <section className="overflow-hidden rounded-[24px] glass-dark px-5 py-6 text-white card-shadow-dark">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Command deck</div>
              <div className="mt-2 text-[26px] font-light leading-tight tracking-[-0.03em] text-white">
                {activeSong ? activeSong.title : "Start your first room"}
              </div>
              <div className="mt-2 text-sm text-white/45">
                {activeSong
                  ? `${activeSongReadiness}% ready · ${summary.activeIncomeStreams} income stream${summary.activeIncomeStreams === 1 ? "" : "s"} active`
                  : "Add one release and Pocket will show the room, the gap, and the missing files."}
              </div>
            </div>
            {activeSongReadiness !== null ? <ReadinessRing score={activeSongReadiness} /> : null}
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
              {catalogReadiness}% catalog ready
            </span>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <Link href={primaryActionHref} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0d0d0b]">
              {primaryActionLabel}
            </Link>
            <Link href="/a" className="text-xs font-medium text-white/45 hover:text-white/80 transition">
              Ask A →
            </Link>
          </div>
        </section>

        {/* Gap strip */}
        {songs.length > 0 && summary.totalEstimatedGap > 0 && (
          <Link
            href="/harvest"
            className="flex items-center justify-between gap-3 rounded-[18px] border border-[#ef9f27]/25 bg-[#ef9f27]/10 px-5 py-4 press card-shadow"
          >
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ef9f27]/60">The Gap</div>
              <span className="text-sm font-medium text-[#ef9f27]">
                {formatGapEstimate(summary.totalEstimatedGap)} uncollected · {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"}
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-[#ef9f27] px-3 py-1 text-[11px] font-semibold text-[#080810]">Fix →</span>
          </Link>
        )}

        {/* Active goal — surfaces what they told us in onboarding */}
        {(profile.mainGoal || profile.targetWindow) && songs.length === 0 && (
          <section className="rounded-[20px] glass-electric px-5 py-4 card-shadow">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#7c6fef]/70">Active goal</div>
            <div className="mt-1.5 text-[15px] text-white/90">{profile.mainGoal || "No goal set"}</div>
            {profile.targetWindow && (
              <div className="mt-1 text-[11px] text-white/40">Target window: {profile.targetWindow}</div>
            )}
            <Link href="/settings" className="mt-3 block text-[11px] text-[#7c6fef] hover:text-[#9080ff] transition">
              Update goal →
            </Link>
          </section>
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
                  <span className="shrink-0 mt-0.5 text-[11px] font-bold text-white/50">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{action.action} · {action.collectionBody}</div>
                    {action.songTitle && <div className="text-[11px] text-white/50 mt-0.5">{action.songTitle}</div>}
                  </div>
                  {action.estimatedValue > 0 && (
                    <span className="shrink-0 rounded-full bg-[#faeeda] px-2.5 py-1 text-[10px] font-semibold text-[#ef9f27]">
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
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Most urgent room</div>
            <Link
              href={`/projects/${activeSong.id}`}
              className="flex items-center gap-4 rounded-[14px] glass-subtle px-4 py-4 press"
            >
              <ReadinessRing score={getSongReadinessScore(activeSong)} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-[var(--text-primary)] truncate">{activeSong.title}</div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  {activeSong.releaseDate ? `Released ${activeSong.releaseDate}` : "Release date not set"}
                </div>
                <div className="mt-1 text-[11px] text-white/35">
                  {activeSongReadiness !== null && activeSongReadiness < 70 ? "Needs cleanup before this feels release-safe." : "In stronger shape — review the next move."}
                </div>
              </div>
              <span className="text-white/50 text-sm">→</span>
            </Link>
            <Link
              href="/projects"
              className="mt-2 block text-center text-[11px] text-white/50 hover:text-white/90 transition py-2"
            >
              View all rooms →
            </Link>
          </section>
        ) : (
          <section className="rounded-[20px] glass-dark p-5 card-shadow-dark">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Start your first room</div>
            <div className="mt-2 text-sm leading-6 text-white/50">
              One release unlocks the real workflow: room, gap scan, vault tracking, and next actions.
            </div>
            <div className="mt-3 space-y-2">
              {[
                { step: "1", label: "Add your first release", sub: "Title first. Add deeper metadata once the room exists.", href: "/projects/new", done: false },
                { step: "2", label: "Open the room", sub: "See what is blocking release readiness and revenue collection.", href: "/projects", done: false },
                { step: "3", label: "File the core assets", sub: "Master, artwork, split sheet, and contract.", href: "/vault", done: false },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-start gap-3 rounded-[14px] border-[0.5px] border-white/8 px-4 py-3 transition hover:bg-white/5 press"
                >
                  <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-white/20 text-[10px] font-medium text-white/40">
                    {item.step}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-white/90">{item.label}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-white/40">{item.sub}</div>
                  </div>
                  <div className="mt-1 shrink-0 text-[11px] text-[#7c6fef]">→</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Catalog — compact */}
        {songs.length > 1 && (
          <section className="rounded-[20px] glass p-5 card-shadow">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                More rooms
              </div>
              <Link href="/projects" className="text-[11px] font-medium text-[var(--amber)]">
                {songs.length} releases →
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
                      <div className="mt-0.5 text-[11px] text-white/50">{song.isrc ?? "No ISRC"}</div>
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
