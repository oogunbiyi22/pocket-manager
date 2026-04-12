"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  formatMoney,
  getRevenueGapSummary,
  getSongEstimatedGap,
  getSongReadinessScore,
} from "@/lib/backstage-data";

const incomeTypes = [
  { label: "Streaming", value: 2100 },
  { label: "Performance", value: 890 },
  { label: "Sync", value: 1200 },
  { label: "Mechanical", value: 630 },
];

const harvestAreas = [
  { href: "/financial", title: "Financial summary", body: "Current-quarter income by song and collection path." },
  { href: "/actions", title: "The Gap queue", body: "The prioritized work that closes missing money." },
  { href: "/statements", title: "Royalty statements", body: "Upload and review distributor or royalty-body statements." },
  { href: "/contracts", title: "Contracts", body: "Scan deals for risk, plain-English flags, and attorney questions." },
  { href: "/forecast", title: "Income forecast", body: "Compare current setup against fully optimized registration." },
  { href: "/valuation", title: "Catalog valuation", body: "See what most affects the catalog's asset value." },
];

export default function HarvestPage() {
  const { songs } = usePocket();
  const summary = getRevenueGapSummary(songs);

  return (
    <AppShell title="Harvest" eyebrow="The business">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">The business</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Secured</div>
              <div className="mt-2 text-5xl font-light tracking-[-0.04em]">{formatMoney(summary.totalSecured)}</div>
            </div>
            <div className="rounded-lg border-[0.5px] border-[#faeeda]/60 bg-[#faeeda] px-4 py-3 text-[#854f0b]">
              <div className="text-[11px] uppercase tracking-[0.18em]">The Gap</div>
              <div className="mt-2 text-3xl font-normal">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-4">
          {incomeTypes.map((type) => (
            <Link key={type.label} href="/financial" className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a9a8a]">{type.label}</div>
              <div className="mt-2 text-2xl font-normal text-[#0d0d0b]">{formatMoney(type.value)}</div>
            </Link>
          ))}
        </section>

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">By song</div>
          <div className="space-y-3">
            {songs.slice(0, 4).map((song) => {
              const readiness = getSongReadinessScore(song);
              const estimatedGap = getSongEstimatedGap(song);
              const optimized = estimatedGap === 0;

              return (
                <Link key={song.id} href={`/projects/${song.id}`} className="flex items-center gap-4 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35">
                  <div className={`grid size-12 shrink-0 place-items-center rounded-full border-[3px] text-[13px] font-medium ${optimized ? "border-[#97c459] text-[#3b6d11]" : "border-[#ef9f27] text-[#854f0b]"}`}>
                    {readiness}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium text-[#111]">{song.title}</div>
                    <div className="mt-1 text-xs text-[#6b6b65]">
                      {formatMoney(song.revenueStreams.reduce((total, stream) => total + stream.actualAmount, 0))} collected · {optimized ? "0 gaps" : `${formatGapEstimate(estimatedGap)} missing`}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${optimized ? "bg-[#eaf3de] text-[#3b6d11]" : "bg-[#fcebeb] text-[#a32d2d]"}`}>
                    {optimized ? "Full" : "Gap"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {harvestAreas.map((area) => (
            <Link key={area.href} href={area.href} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4 transition hover:border-black/35">
              <div className="text-[15px] font-medium text-[#111]">{area.title}</div>
              <p className="mt-2 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
