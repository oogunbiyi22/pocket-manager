"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getNextRevenueAction,
  getRevenueGapSummary,
  getSongEstimatedGap,
  getSongReadinessScore,
  type SongCatalogItem,
} from "@/lib/backstage-data";

function deriveIncomeCategories(songs: SongCatalogItem[]) {
  const streams = songs.flatMap((s) => s.revenueStreams);
  const sum = (types: string[]) =>
    streams
      .filter((s) => types.includes(s.streamType))
      .reduce((t, s) => t + s.actualAmount, 0);

  return [
    { label: "Streaming", value: sum(["streaming", "youtube"]) },
    { label: "Performance", value: sum(["digital_performance", "performance_royalty", "neighboring_rights"]) },
    { label: "Sync", value: sum(["sync"]) },
    { label: "Mechanical", value: sum(["mechanical"]) },
  ];
}

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
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export default function HarvestPage() {
  const { songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const incomeCategories = deriveIncomeCategories(songs);
  const nextAction = getNextRevenueAction(songs);

  // Biggest opportunity: song with highest gap
  const topGapSong = songs.slice().sort((a, b) => getSongEstimatedGap(b) - getSongEstimatedGap(a))[0];
  const topGap = topGapSong ? getSongEstimatedGap(topGapSong) : 0;

  const totalOptimized = summary.totalSecured + summary.totalEstimatedGap;

  return (
    <AppShell title="Harvest" eyebrow="The business">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-white text-[#111]">

        {/* Command header */}
        <section className="bg-[#0d0d0b] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Harvest</div>
          <div className="mt-3 text-[48px] font-light leading-none tracking-[-0.04em]">
            {formatMoney(summary.totalSecured)}
          </div>
          {summary.totalEstimatedGap > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#ef9f27]/40 bg-[#faeeda] px-3 py-2">
              <span className="text-sm font-medium text-[#854f0b]">
                The Gap · {formatGapEstimate(summary.totalEstimatedGap)} uncollected
              </span>
              <Link href="/actions" className="text-[11px] text-[#854f0b]">Fix →</Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/45">No gaps — catalog fully optimized.</p>
          )}
        </section>

        {/* 2x2 income grid */}
        <section className="grid grid-cols-2 gap-px bg-black/10 border-y border-black/10">
          {incomeCategories.map((cat) => (
            <Link
              key={cat.label}
              href="/financial"
              className="bg-[#f5f4f0] px-5 py-4 transition hover:bg-[#eeede8]"
            >
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a9a8a]">{cat.label}</div>
              <div className="mt-2 text-2xl font-light text-[#0d0d0b]">{formatMoney(cat.value)}</div>
            </Link>
          ))}
        </section>

        {/* Biggest opportunity callout */}
        {topGapSong && topGap > 0 && (
          <section className="border-y border-[#ef9f27]/30 bg-[#faeeda] px-5 py-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#854f0b]">Biggest opportunity</div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <div>
                <div className="text-[15px] font-medium text-[#854f0b]">&ldquo;{topGapSong.title}&rdquo;</div>
                <div className="mt-1 text-sm text-[#854f0b]/70">
                  {nextAction.action} via {nextAction.collectionBody} · {formatGapEstimate(topGap)} missing
                </div>
              </div>
              <Link
                href={`/projects/${topGapSong.id}`}
                className="shrink-0 rounded-lg bg-[#854f0b] px-4 py-2 text-xs font-medium text-white"
              >
                Fix now →
              </Link>
            </div>
          </section>
        )}

        {/* Income forecast */}
        <section className="border-b border-black/10 px-5 py-5">
          <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Income forecast</div>
          <div className="space-y-3">
            <ForecastBar label="Secured this quarter" value={summary.totalSecured} max={totalOptimized} color="#97c459" />
            <ForecastBar label="Fully optimized potential" value={totalOptimized} max={totalOptimized} color="#ef9f27" />
          </div>
          <p className="mt-3 text-xs text-[#9a9a8a]">
            Closing all gaps adds {formatGapEstimate(summary.totalEstimatedGap)} ({summary.songsWithGaps} songs).
          </p>
        </section>

        {/* Song-by-song breakdown */}
        <section className="px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">By song</div>
          <div className="space-y-2">
            {songs.slice(0, 6).map((song) => {
              const readiness = getSongReadinessScore(song);
              const gap = getSongEstimatedGap(song);
              const collected = song.revenueStreams.reduce((t, s) => t + s.actualAmount, 0);
              const optimized = gap === 0;

              return (
                <Link
                  key={song.id}
                  href={`/projects/${song.id}`}
                  className="flex items-center gap-3 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] px-4 py-3 transition hover:border-black/35"
                >
                  <SmallRing score={readiness} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-normal text-[#111]">{song.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#6b6b65]">
                      {formatMoney(collected)} collected
                      {!optimized ? ` · ${formatGapEstimate(gap)} missing` : ""}
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
        <section className="grid gap-3 border-t border-black/10 px-5 py-5 sm:grid-cols-2">
          {[
            { href: "/financial", title: "Financial summary", body: "Current-quarter income by song and collection path." },
            { href: "/actions", title: "The Gap queue", body: "The prioritized work that closes missing money." },
            { href: "/statements", title: "Royalty statements", body: "Upload and review distributor or royalty-body statements." },
            { href: "/contracts", title: "Contracts", body: "Scan deals for risk, plain-English flags, and attorney questions." },
            { href: "/forecast", title: "Income forecast", body: "Compare current setup against fully optimized registration." },
            { href: "/valuation", title: "Catalog valuation", body: "See what most affects the catalog's asset value." },
          ].map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35"
            >
              <div className="text-[14px] font-medium text-[#111]">{area.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
