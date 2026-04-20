"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatMoney,
  formatGapEstimate,
  getCatalogReadinessScore,
  getNextRevenueAction,
  getReadinessLevel,
  getRevenueGapSummary,
  getSongGapScore,
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

function statusBadge(song: SongCatalogItem) {
  const gapScore = getSongGapScore(song);
  const readiness = getSongReadinessScore(song);
  if (gapScore === 0) return { label: "Optimized", className: "bg-[#eaf3de] text-[#3b6d11]" };
  if (gapScore >= 60) return { label: "High gap", className: "bg-[#fcebeb] text-[#a32d2d]" };
  if (readiness >= 70) return { label: "Gaps", className: "bg-[#faeeda] text-[#854f0b]" };
  return { label: "Needs work", className: "bg-[#faeeda] text-[#854f0b]" };
}

const BRIEF_KEY = "pocket_brief_dismissed";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function MobilePage() {
  const { completeRevenueAction, songs, profile } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const catalogReadiness = getCatalogReadinessScore(songs);
  const readinessLevel = getReadinessLevel(catalogReadiness);
  const [clearedActions, setClearedActions] = useState<string[]>([]);

  // Daily brief: show once per day, persist dismiss in localStorage
  const [briefVisible, setBriefVisible] = useState(false);
  const briefChecked = useRef(false);
  useEffect(() => {
    if (briefChecked.current) return;
    briefChecked.current = true;
    try {
      const dismissed = localStorage.getItem(BRIEF_KEY);
      if (dismissed !== getTodayKey()) {
        setBriefVisible(true);
      }
    } catch {
      setBriefVisible(true);
    }
  }, []);

  function dismissBrief() {
    try { localStorage.setItem(BRIEF_KEY, getTodayKey()); } catch { /* noop */ }
    setBriefVisible(false);
  }

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

  const nextAction = getNextRevenueAction(availableSongs.length ? availableSongs : songs);
  const activeActionId = `${nextAction.songId}-${nextAction.streamType}-${nextAction.collectionBody}`;
  const actionIsClearable = nextAction.estimatedValue > 0;

  function clearCurrentAction() {
    if (!actionIsClearable) return;
    setClearedActions((current) =>
      current.includes(activeActionId) ? current : [...current, activeActionId],
    );
  }

  function completeCurrentAction() {
    if (!actionIsClearable) return;
    completeRevenueAction(nextAction.songId, nextAction.streamType, nextAction.collectionBody);
    setClearedActions((current) => current.filter((item) => item !== activeActionId));
  }

  return (
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-md space-y-4 text-[#111]">
        {/* Top row */}
        <header className="flex items-center justify-between px-1 pt-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5d5a54]">Pocket Manager</div>
            <div className="text-[15px] text-[#111]">The Situation</div>
          </div>
          <Link
            href="/settings"
            className="grid size-10 place-items-center rounded-full border border-black/10 bg-white text-sm font-medium text-[#111]"
            aria-label="Open profile"
          >
            {profile.artistName?.[0]?.toUpperCase() ?? "?"}
          </Link>
        </header>

        {/* Command surface — total secured */}
        <section className="overflow-hidden rounded-[24px] glass-dark px-5 py-6 text-white card-shadow-dark">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Total secured</div>
          <div className="mt-3 text-[44px] font-light leading-none tracking-[-0.04em]">
            $<CountUp target={summary.totalSecured} />
          </div>
          <div className="mt-3 text-sm text-white/45">
            This quarter · {summary.activeIncomeStreams} stream{summary.activeIncomeStreams === 1 ? "" : "s"} active
          </div>
          {/* Catalog readiness bar */}
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
        {songs.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-black/15 px-5 py-4 card-shadow">
            <span className="text-sm text-[#9a9a8a]">Add a release to see your revenue gap.</span>
          </div>
        ) : summary.totalEstimatedGap > 0 ? (
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
        ) : (
          <div className="flex items-center gap-3 rounded-[18px] bg-[#eaf3de] px-5 py-4 card-shadow">
            <span className="text-sm text-[#3b6d11]">No gaps — catalog is clean.</span>
          </div>
        )}

        {/* A daily brief */}
        {briefVisible && (
          <section style={{ animation: "fadeSlideIn 0.35s ease-out both" }}>
            <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div className="overflow-hidden rounded-[20px] glass-dark card-shadow-dark">
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">A · Today</div>
                  <p className="mt-2 text-sm leading-7 text-white/75">
                    {summary.songsWithGaps > 0
                      ? `${summary.songsWithGaps} song${summary.songsWithGaps === 1 ? "" : "s"} with open gaps. Biggest move: ${nextAction.title} — ${formatGapEstimate(nextAction.estimatedValue)} uncollected.`
                      : "Catalog fully optimized. No open gaps today."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissBrief}
                  className="shrink-0 text-xl font-thin text-white/30 hover:text-white/60 transition"
                  aria-label="Dismiss daily brief"
                >
                  ×
                </button>
              </div>
              <div className="border-t border-white/[0.08] px-5 py-3">
                <Link href="/a" className="text-xs font-medium text-white/40 hover:text-white/60 transition">
                  Ask A →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Next action card */}
        <section className="rounded-[20px] glass p-5 card-shadow">
          {songs.length === 0 ? (
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
          ) : (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Next action</div>
              <div className="mt-0.5 text-[11px] text-[#9a9a8a]">{nextAction.songTitle}</div>
              <div className="mt-3 text-[18px] font-normal leading-7 text-[var(--text-primary)]">
                {nextAction.action} via {nextAction.collectionBody}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {nextAction.estimatedValue > 0 ? (
                  <span className="rounded-full bg-[#faeeda] px-3 py-1 font-medium text-[#854f0b]">
                    {formatGapEstimate(nextAction.estimatedValue)}
                  </span>
                ) : null}
                <span className="rounded-full bg-black/[0.06] px-3 py-1 text-[#34312d]">
                  {nextAction.estimatedTime}
                </span>
              </div>
              <Link
                href={nextAction.songId ? `/projects/${nextAction.songId}` : "/projects"}
                className="mt-5 block rounded-xl bg-[var(--bg-dark)] px-4 py-3.5 text-center text-sm font-medium text-white press"
              >
                Start now
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={clearCurrentAction}
                  className="rounded-xl border-[0.5px] border-black/[0.1] px-3 py-2.5 text-xs text-[var(--text-muted)] press"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={completeCurrentAction}
                  className="rounded-xl border-[0.5px] border-black/[0.1] px-3 py-2.5 text-xs text-[var(--text-muted)] press"
                >
                  Mark done
                </button>
              </div>
            </>
          )}
        </section>

        {/* Song list with readiness rings */}
        <section className="rounded-[20px] glass p-5 card-shadow">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Your catalog
            </div>
            {songs.length > 5 && (
              <Link href="/work" className="text-[11px] font-medium text-[var(--amber)]">
                {songs.length} songs →
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {songs.slice(0, 5).map((song) => {
              const readiness = getSongReadinessScore(song);
              const badge = statusBadge(song);

              return (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="flex items-center gap-3 rounded-[14px] glass-subtle px-4 py-3 press"
                >
                  <ReadinessRing score={readiness} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-normal text-[var(--text-primary)]">{song.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#9a9a8a]">{song.isrc}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {songs.length === 0 ? (
            <Link
              href="/projects/new"
              className="mt-3 flex flex-col items-center gap-2 rounded-[14px] border-[0.5px] border-dashed border-black/15 px-4 py-6 text-center press"
            >
              <span className="text-2xl">🎵</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">Add your first song</span>
              <span className="text-xs text-[#9a9a8a]">Start tracking gaps and registration</span>
            </Link>
          ) : (
            <Link
              href="/work"
              className="mt-3 block rounded-[14px] border-[0.5px] border-dashed border-black/15 px-4 py-3 text-center text-sm text-[#9a9a8a] press"
            >
              View full catalog →
            </Link>
          )}
        </section>
      </main>
    </AppShell>
  );
}
