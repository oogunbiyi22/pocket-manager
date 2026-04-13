"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatMoney,
  formatGapEstimate,
  getNextRevenueAction,
  getRevenueGapSummary,
  getSongGapScore,
  getSongReadinessScore,
  type SongCatalogItem,
} from "@/lib/backstage-data";

function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span>{display}</span>;
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
    <AppShell title="Pocket Manager" eyebrow="The situation">
      <main className="mx-auto max-w-md overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] text-[#111]">
        {/* Top row */}
        <header className="flex items-center justify-between bg-[#f5f4f0] px-5 py-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5d5a54]">Pocket Manager</div>
            <div className="text-[15px] text-[#111]">The Situation</div>
          </div>
          <Link
            href="/settings"
            className="grid size-10 place-items-center rounded-full border border-black/10 bg-white text-sm font-medium text-[#111]"
            aria-label="Open profile"
          >
            {profile.artistName?.[0] ?? "B"}
          </Link>
        </header>

        {/* Command surface — total secured */}
        <section className="bg-[#0d0d0b] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Total secured</div>
          <div className="mt-3 text-[48px] font-light leading-none tracking-[-0.04em]">
            $<CountUp target={summary.totalSecured} />
          </div>
          <div className="mt-3 text-sm text-white/45">
            This quarter · {summary.activeIncomeStreams} stream{summary.activeIncomeStreams === 1 ? "" : "s"} active
          </div>
        </section>

        {/* Gap strip */}
        {summary.totalEstimatedGap > 0 ? (
          <div className="flex items-center justify-between gap-3 border-y border-[#ef9f27]/40 bg-[#faeeda] px-5 py-3">
            <span className="text-sm font-medium text-[#854f0b]">
              The Gap · {formatGapEstimate(summary.totalEstimatedGap)} uncollected across{" "}
              {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"}
            </span>
            <Link href="/harvest" className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#854f0b]">
              Fix →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 border-y border-[#97c459]/30 bg-[#eaf3de] px-5 py-3">
            <span className="text-sm text-[#3b6d11]">No gaps detected — catalog looks clean.</span>
          </div>
        )}

        {/* A daily brief */}
        {briefVisible && (
          <motion.section
            className="px-5 pt-5"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y < -40) dismissBrief(); }}
          >
            <div className="overflow-hidden rounded-xl border-[0.5px] border-white/10 bg-[#141412]">
              <div className="flex items-start justify-between gap-3 px-4 py-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">A · Today</div>
                  <p className="mt-2 text-sm leading-6 text-white/80">
                    {summary.songsWithGaps > 0
                      ? `${summary.songsWithGaps} song${summary.songsWithGaps === 1 ? "" : "s"} with open gaps. Biggest move: ${nextAction.title} — ${formatGapEstimate(nextAction.estimatedValue)} uncollected.`
                      : "Catalog fully optimized. No open gaps today."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissBrief}
                  className="shrink-0 text-lg font-light text-white/30"
                  aria-label="Dismiss daily brief"
                >
                  ×
                </button>
              </div>
              <div className="border-t border-white/10 px-4 py-3">
                <Link href="/a" className="text-xs font-medium text-white/45">
                  Ask A →
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {/* Next action card */}
        <section className="px-5 py-5">
          <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Next action</div>
            <div className="mt-1 text-[11px] text-[#9a9a8a]">{nextAction.songTitle}</div>
            <div className="mt-2 text-[17px] font-normal leading-6 text-[#111]">
              {nextAction.action} via {nextAction.collectionBody}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {nextAction.estimatedValue > 0 ? (
                <span className="rounded-full bg-[#faeeda] px-3 py-1 text-[#854f0b]">
                  {formatGapEstimate(nextAction.estimatedValue)}
                </span>
              ) : null}
              <span className="rounded-full bg-black/[0.06] px-3 py-1 text-[#34312d]">
                {nextAction.estimatedTime}
              </span>
            </div>
            <Link
              href={`/projects/${nextAction.songId}`}
              className="mt-4 block rounded-lg bg-[#0a0a0a] px-4 py-3 text-center text-sm font-medium text-white transition duration-200 ease-out hover:bg-[#242424]"
            >
              Start now
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={clearCurrentAction}
                className="rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#5d5a54]"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={completeCurrentAction}
                className="rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#5d5a54]"
              >
                Mark done
              </button>
            </div>
          </div>
        </section>

        {/* Song list with readiness rings */}
        <section className="px-5 pb-6">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">
            Active Rooms
          </div>
          <div className="space-y-2">
            {songs.slice(0, 5).map((song) => {
              const readiness = getSongReadinessScore(song);
              const badge = statusBadge(song);

              return (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="flex items-center gap-3 rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3 transition duration-200 ease-out hover:border-black/35"
                >
                  <ReadinessRing score={readiness} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-normal text-[#111]">{song.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#9a9a8a]">{song.isrc}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <Link
            href="/work"
            className="mt-4 block rounded-xl border-[0.5px] border-dashed border-black/15 px-4 py-3 text-center text-sm text-[#9a9a8a] transition hover:border-black/30"
          >
            View full catalog →
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
