"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getCatalogReadinessScore,
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
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
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
        <span className="text-[11px] text-white/50">{label}</span>
        <span className="text-[13px] font-normal text-white/90">{formatMoney(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
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
  const queue = getRevenueActionQueue(songs).slice(0, 5);
  const catalogReadiness = getCatalogReadinessScore(songs);
  const readinessLevel = getReadinessLevel(catalogReadiness);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  const totalOptimized = summary.totalSecured + summary.totalEstimatedGap;

  function markDone(id: string, songId: string, streamType: RevenueStreamType, collectionBody: string) {
    completeRevenueAction(songId, streamType, collectionBody);
    setDoneIds((prev) => [...prev, id]);
  }

  const visibleQueue = queue.filter((item) => !doneIds.includes(item.id));

  return (
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-4xl space-y-4 text-white/90">

        <header className="flex items-center justify-between px-1 pt-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Harvest</div>
            <div className="text-[15px] text-white/90">The Gap</div>
          </div>
          <Link href="/projects" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 press">
            Rooms →
          </Link>
        </header>

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
            <div className="mt-4 rounded-xl border-[0.5px] border-[#5fcf7e]/30 bg-[#97c459]/10 px-4 py-3 text-sm text-[#97c459]">
              Catalog fully optimized · no open gaps
            </div>
          )}
        </section>

        {/* Pre-catalog tasks — show before first song is added */}
        {songs.length === 0 && (
          <section className="rounded-[24px] glass card-shadow px-5 py-5">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Before your first release</div>
            <p className="mb-4 text-[13px] text-white/50 leading-5">Every dollar depends on these being set up. Do them once.</p>
            <div className="space-y-2">
              {([
                { label: "Register with a PRO", sub: "ASCAP, BMI, SOCAN, or PRS — collect performance royalties from radio, TV, live, and streaming", href: "/harvest", urgent: true },
                { label: "Get your ISRC prefix", sub: "US-only: apply via RIAA ($95) or free through your distributor. Required for every release.", href: "/projects/new", urgent: true },
                { label: "Register with SoundExchange", sub: "Collect digital performance royalties (Spotify, Pandora, satellite radio). Free, fast.", href: "/platforms", urgent: true },
                { label: "Set up publishing administration", sub: "Songtrust ($250 one-time) or DistroKid Sync collects your mechanical royalties globally", href: "/publishing", urgent: false },
                { label: "Choose your distributor", sub: "DistroKid, TuneCore, or CD Baby — gets your music on DSPs and claims your streaming revenue", href: "/platforms", urgent: false },
              ] as { label: string; sub: string; href: string; urgent: boolean }[]).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-3 rounded-[14px] border-[0.5px] border-white/8 px-4 py-3 transition hover:bg-white/5 press"
                >
                  <div className={`mt-1 size-2 shrink-0 rounded-full ${item.urgent ? "bg-[#f05c5c]" : "bg-white/20"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] text-white/90">{item.label}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-white/40">{item.sub}</div>
                  </div>
                  <span className="mt-1 shrink-0 text-[11px] text-[#7c6fef]">→</span>
                </Link>
              ))}
            </div>
            <Link
              href="/projects/new"
              className="mt-4 block rounded-xl btn-electric py-3 text-center text-sm font-medium press"
            >
              Add your first release →
            </Link>
          </section>
        )}

        {/* 2×2 income grid */}
        {songs.length > 0 && (
        <section className="grid grid-cols-2 gap-3">
          {incomeCategories.map((cat) => (
            <Link key={cat.label} href="/financial"
              className="rounded-[20px] glass card-shadow px-5 py-4 press">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">{cat.label}</div>
              <div className="mt-2 text-[24px] font-light text-white/90">{formatMoney(cat.value)}</div>
            </Link>
          ))}
        </section>
        )}

        {/* Gap queue — top 5 actions inline */}
        {visibleQueue.length > 0 && (
          <section className="rounded-[24px] glass card-shadow px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Gap queue</div>
              <Link href="/actions" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#f0a832]">
                Full queue →
              </Link>
            </div>
            <div className="space-y-2">
              {visibleQueue.map((item, i) => (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-[14px] transition ${
                    i === 0 ? "bg-[#f0a832]/10" : "glass-subtle"
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
                        <span className="text-[11px] text-white/50">{item.songTitle}</span>
                      </div>
                      <div className="mt-1 text-[15px] font-normal text-white/90">
                        {item.action} via {item.collectionBody}
                      </div>
                      <div className="mt-1 text-[11px] text-white/50">{item.estimatedTime}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[15px] font-normal text-[#f0a832]">
                        {formatGapEstimate(item.estimatedValue)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-white/8 px-4 py-2.5">
                    <Link
                      href={`/projects/${item.songId}`}
                      className="rounded-lg btn-electric px-3 py-1.5 text-xs font-medium transition"
                    >
                      Start
                    </Link>
                    <button
                      type="button"
                      onClick={() => markDone(item.id, item.songId, item.streamType as RevenueStreamType, item.collectionBody)}
                      className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/5"
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
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Gap by type</div>
            <div className="overflow-hidden rounded-[14px] glass-subtle">
              {gapByType.map((row, i) => (
                <div
                  key={row.type}
                  className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                    i < gapByType.length - 1 ? "border-b-[0.5px] border-white/8" : ""
                  }`}
                >
                  <span className="text-white/90">{row.label}</span>
                  <span className="rounded-full bg-[#f0a832]/10 px-3 py-1 text-[11px] font-medium text-[#f0a832]">
                    {formatGapEstimate(row.gap)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Income forecast */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Income forecast</div>
          <div className="space-y-3">
            <ForecastBar label="Secured this quarter" value={summary.totalSecured} max={totalOptimized} color="#97c459" />
            <ForecastBar label="Fully optimized potential" value={totalOptimized} max={totalOptimized} color="#ef9f27" />
          </div>
          <p className="mt-3 text-xs text-white/50">
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
                    <div className="truncate text-[15px] font-normal text-white/90">{song.title}</div>
                    <div className="mt-0.5 text-[11px] text-white/50">
                      {formatMoney(collected)} collected{!optimized ? ` · ${formatGapEstimate(gap)} missing` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${optimized ? "bg-[#5fcf7e]/10 text-[#5fcf7e]" : "bg-[#f05c5c]/10 text-[#f05c5c]"}`}>
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
            { href: "/projects", title: "Rooms", body: "Open any room to work the gap for that release." },
            { href: "/financial", title: "Financial summary", body: "Current-quarter income by song and path." },
            { href: "/actions", title: "Full Gap queue", body: "Every prioritized action with step-by-step guides." },
            { href: "/statements", title: "Royalty statements", body: "Import and review statements from any platform." },
            { href: "/contracts", title: "Contracts", body: "Plain-English flags and attorney questions." },
            { href: "/forecast", title: "Income forecast", body: "Current vs. fully optimized projection." },
          ].map((area) => (
            <Link key={area.href} href={area.href}
              className="rounded-[20px] glass card-shadow p-5 press">
              <div className="text-[14px] font-medium text-white/90">{area.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-white/50">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
