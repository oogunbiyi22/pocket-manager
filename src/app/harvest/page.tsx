"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getCatalogReadinessScore,
  getNextRevenueAction,
  getReadinessLevel,
  getRevenueActionQueue,
  getRevenueGapSummary,
  getSongEstimatedGap,
  getSongReadinessScore,
  type RevenueStreamType,
  type SongCatalogItem,
} from "@/lib/backstage-data";

// ─── Stream type labels ────────────────────────────────────────────────────
const STREAM_LABELS: Record<RevenueStreamType, string> = {
  streaming: "Streaming",
  digital_performance: "Digital Perf.",
  performance_royalty: "Performance",
  mechanical: "Mechanical",
  youtube: "Content ID",
  neighboring_rights: "Neighboring",
  sync: "Sync",
};

function deriveIncomeCategories(songs: SongCatalogItem[]) {
  const streams = songs.flatMap((s) => s.revenueStreams);
  const sum = (types: RevenueStreamType[]) =>
    streams.filter((s) => types.includes(s.streamType)).reduce((t, s) => t + s.actualAmount, 0);
  return [
    { label: "Streaming", value: sum(["streaming", "youtube"]) },
    { label: "Performance", value: sum(["digital_performance", "performance_royalty", "neighboring_rights"]) },
    { label: "Mechanical", value: sum(["mechanical"]) },
    { label: "Sync", value: sum(["sync"]) },
  ];
}

function deriveGapByType(songs: SongCatalogItem[]) {
  const streams = songs.flatMap((s) => s.revenueStreams);
  const types: RevenueStreamType[] = ["digital_performance", "performance_royalty", "mechanical", "youtube", "neighboring_rights"];
  return types
    .map((t) => ({
      type: t,
      label: STREAM_LABELS[t],
      gap: streams.filter((s) => s.streamType === t).reduce((acc, s) => acc + s.estimatedGap, 0),
    }))
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

// ─── Components ────────────────────────────────────────────────────────────
function SmallRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e8e7e2" strokeWidth="3" />
      <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`} transform="rotate(-90 20 20)" />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="500" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function ForecastBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-[#6b6b65]">{label}</span>
        <span className="text-[13px] font-normal text-[#111]">{formatMoney(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/8">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ backgroundColor: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function HarvestPage() {
  const { completeRevenueAction, songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const incomeCategories = deriveIncomeCategories(songs);
  const gapByType = deriveGapByType(songs);
  const nextAction = getNextRevenueAction(songs);
  const queue = getRevenueActionQueue(songs).slice(0, 5);
  const catalogReadiness = getCatalogReadinessScore(songs);
  const readinessLevel = getReadinessLevel(catalogReadiness);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const topGapSong = songs.slice().sort((a, b) => getSongEstimatedGap(b) - getSongEstimatedGap(a))[0];
  const topGap = topGapSong ? getSongEstimatedGap(topGapSong) : 0;
  const totalOptimized = summary.totalSecured + summary.totalEstimatedGap;

  function markDone(id: string, songId: string, streamType: RevenueStreamType, collectionBody: string) {
    completeRevenueAction(songId, streamType, collectionBody);
    setDoneIds((prev) => [...prev, id]);
  }

  const visibleQueue = queue.filter((item) => !doneIds.includes(item.id));

  return (
    <AppShell title="Harvest" eyebrow="The business">
      <main className="mx-auto max-w-4xl space-y-4 text-[#111]">

        {/* Command surface */}
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Harvest</div>
          <div className="mt-3 text-[40px] font-light leading-none tracking-[-0.04em]">
            {formatMoney(summary.totalSecured)}
          </div>
          <div className="mt-2 text-sm text-white/35">
            This quarter · {summary.activeIncomeStreams} stream{summary.activeIncomeStreams === 1 ? "" : "s"} active
          </div>

          {summary.totalEstimatedGap > 0 ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-[0.5px] border-[#ef9f27]/30 bg-[#ef9f27]/10 px-4 py-3">
              <span className="text-sm text-[#ef9f27]">
                ● The Gap · {formatGapEstimate(summary.totalEstimatedGap)} uncollected across {summary.songsWithGaps} songs
              </span>
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.1em] text-[#ef9f27]">
                {catalogReadiness}% · {readinessLevel}
              </span>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border-[0.5px] border-[#97c459]/30 bg-[#97c459]/10 px-4 py-3 text-sm text-[#97c459]">
              Catalog fully optimized · no open gaps
            </div>
          )}
        </section>

        {/* 2×2 income grid */}
        <section className="grid grid-cols-2 gap-3">
          {incomeCategories.map((cat) => (
            <Link key={cat.label} href="/financial"
              className="rounded-[20px] glass card-shadow px-5 py-4 press">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a9a8a]">{cat.label}</div>
              <div className="mt-2 text-[24px] font-light text-[#0d0d0b]">{formatMoney(cat.value)}</div>
            </Link>
          ))}
        </section>

        {/* Gap queue — top 5 actions inline */}
        {visibleQueue.length > 0 && (
          <section className="rounded-[24px] glass card-shadow px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Gap queue</div>
              <Link href="/actions" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#854f0b]">
                Full queue →
              </Link>
            </div>
            <div className="space-y-2">
              {visibleQueue.map((item, i) => (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-[14px] transition ${
                    i === 0 ? "bg-[#faeeda]" : "glass-subtle"
                  }`}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {i === 0 && (
                          <span className="rounded-full bg-[#ef9f27] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                            #1
                          </span>
                        )}
                        <span className="text-[11px] text-[#9a9a8a]">{item.songTitle}</span>
                      </div>
                      <div className="mt-1 text-[15px] font-normal text-[#111]">
                        {item.action} via {item.collectionBody}
                      </div>
                      <div className="mt-1 text-[11px] text-[#6b6b65]">{item.estimatedTime}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[15px] font-normal text-[#854f0b]">
                        {formatGapEstimate(item.estimatedValue)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-black/[0.06] px-4 py-2.5">
                    <Link
                      href={`/projects/${item.songId}`}
                      className="rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#242424]"
                    >
                      Start
                    </Link>
                    <button
                      type="button"
                      onClick={() => markDone(item.id, item.songId, item.streamType as RevenueStreamType, item.collectionBody)}
                      className="rounded-lg border-[0.5px] border-black/15 px-3 py-1.5 text-xs text-[#6b6b65] transition hover:bg-black/[0.04]"
                    >
                      Mark done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gap breakdown by stream type */}
        {gapByType.length > 0 && (
          <section className="rounded-[24px] glass card-shadow px-5 py-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Gap by type</div>
            <div className="overflow-hidden rounded-[14px] glass-subtle">
              {gapByType.map((row, i) => (
                <div
                  key={row.type}
                  className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                    i < gapByType.length - 1 ? "border-b-[0.5px] border-black/10" : ""
                  }`}
                >
                  <span className="text-[#111]">{row.label}</span>
                  <span className="rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#854f0b]">
                    {formatGapEstimate(row.gap)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Income forecast */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Income forecast</div>
          <div className="space-y-3">
            <ForecastBar label="Secured this quarter" value={summary.totalSecured} max={totalOptimized} color="#97c459" />
            <ForecastBar label="Fully optimized potential" value={totalOptimized} max={totalOptimized} color="#ef9f27" />
          </div>
          <p className="mt-3 text-xs text-[#9a9a8a]">
            Closing all gaps adds {formatGapEstimate(summary.totalEstimatedGap)} across {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"}.
          </p>
        </section>

        {/* Song-by-song breakdown */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">By song</div>
          <div className="space-y-2">
            {songs.slice(0, 6).map((song) => {
              const readiness = getSongReadinessScore(song);
              const gap = getSongEstimatedGap(song);
              const collected = song.revenueStreams.reduce((t, s) => t + s.actualAmount, 0);
              const optimized = gap === 0;
              return (
                <Link key={song.id} href={`/projects/${song.id}`}
                  className="flex items-center gap-3 rounded-[14px] glass-subtle px-4 py-3 press">
                  <SmallRing score={readiness} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-normal text-[#111]">{song.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#6b6b65]">
                      {formatMoney(collected)} collected{!optimized ? ` · ${formatGapEstimate(gap)} missing` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${optimized ? "bg-[#eaf3de] text-[#3b6d11]" : "bg-[#fcebeb] text-[#a32d2d]"}`}>
                    {optimized ? "Full" : "Gap"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick nav */}
        <section className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/financial", title: "Financial summary", body: "Current-quarter income by song and path." },
            { href: "/actions", title: "Full Gap queue", body: "Every prioritized action with step-by-step guides." },
            { href: "/statements", title: "Royalty statements", body: "Import and review statements from any platform." },
            { href: "/contracts", title: "Contracts", body: "Plain-English flags and attorney questions." },
            { href: "/forecast", title: "Income forecast", body: "Current vs. fully optimized projection." },
            { href: "/valuation", title: "Catalog valuation", body: "What drives your catalog's asset value." },
          ].map((area) => (
            <Link key={area.href} href={area.href}
              className="rounded-[20px] glass card-shadow p-5 press">
              <div className="text-[14px] font-medium text-[#111]">{area.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
