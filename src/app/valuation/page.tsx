"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatMoney, getSongConfirmedIncome, getSongEstimatedGap, getSongReadinessScore } from "@/lib/backstage-data";

export default function ValuationPage() {
  const { songs } = usePocket();
  const confirmed = songs.reduce((total, song) => total + getSongConfirmedIncome(song), 0);
  const estimatedGap = songs.reduce((total, song) => total + getSongEstimatedGap(song), 0);
  const averageReadiness = songs.length ? Math.round(songs.reduce((total, song) => total + getSongReadinessScore(song), 0) / songs.length) : 0;
  const readinessMultiplier = Math.max(0.7, averageReadiness / 100);
  const lowEstimate = Math.round((confirmed * 8 + estimatedGap * 3) * readinessMultiplier);
  const highEstimate = Math.round((confirmed * 14 + estimatedGap * 5) * readinessMultiplier);
  const drivers = [
    `${songs.length} catalog song${songs.length === 1 ? "" : "s"} tracked`,
    `${averageReadiness}/100 average readiness`,
    `${formatMoney(confirmed)} confirmed income tracked`,
    `${formatMoney(estimatedGap)} estimated uncollected gap still open`,
  ];

  return (
    <AppShell title="Catalog Valuation" eyebrow="Catalog as asset">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-white/[0.08] bg-[#141412] p-5 text-white/90">
        <section className="rounded-xl border-[0.5px] border-white/[0.08] bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Catalog as asset</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">See what your catalog is worth — and what closing the gaps would add.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Estimated from income, gap potential, and readiness score. Use as a directional benchmark, not an official appraisal.
          </p>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Estimated range</div>
          <div className="mt-4 text-5xl font-light tracking-[-0.04em] text-white/85">
            {formatMoney(lowEstimate)} - {formatMoney(highEstimate)}
          </div>
          <p className="mt-3 text-sm leading-6 text-white/60">
            The fastest way to improve this estimate is to close registration gaps, complete metadata, and import real statement history.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Value drivers</div>
            <div className="mt-3 space-y-2 text-sm text-white/60">
              {drivers.map((driver) => (
                <div key={driver} className="rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.06] px-3 py-3">{driver}</div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Increase value</div>
            <div className="mt-3 space-y-2 text-sm text-white/60">
              <Link href="/actions" className="block rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.06] px-3 py-3 text-white/85">Close top revenue gap</Link>
              <Link href="/statements" className="block rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.06] px-3 py-3 text-white/85">Import statement history</Link>
              <Link href="/projects" className="block rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.06] px-3 py-3 text-white/85">Complete catalog metadata</Link>
              <Link href="/contracts" className="block rounded-lg border-[0.5px] border-white/[0.07] bg-white/[0.06] px-3 py-3 text-white/85">Review risky contracts</Link>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
