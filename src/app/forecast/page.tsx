"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, formatMoney, getSongConfirmedIncome, getSongEstimatedGap } from "@/lib/backstage-data";

const periods = [3, 6, 12];

export default function ForecastPage() {
  const { songs } = usePocket();
  const confirmedQuarter = songs.reduce((total, song) => total + getSongConfirmedIncome(song), 0);
  const gapQuarter = songs.reduce((total, song) => total + getSongEstimatedGap(song), 0);
  const currentMonthly = confirmedQuarter / 3;
  const optimizedMonthly = (confirmedQuarter + gapQuarter) / 3;
  const upsideMonthly = optimizedMonthly - currentMonthly;

  return (
    <AppShell title="Income Forecast" eyebrow="Revenue modeling">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-white/10 glass p-5 text-white/90">
        <section className="rounded-xl border-[0.5px] border-white/10 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Forecast</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">See the real money difference between your current state and fully optimized.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Modeled from your catalog&apos;s confirmed income and estimated uncollected gaps. Fix the gaps to close the upside.
          </p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Current / month" value={formatMoney(currentMonthly)} />
          <Metric label="Optimized / month" value={formatMoney(optimizedMonthly)} />
          <Metric label="Monthly upside" value={formatGapEstimate(upsideMonthly)} />
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Scenarios</div>
          <div className="mt-4 space-y-3">
            {periods.map((months) => {
              const current = currentMonthly * months;
              const optimized = optimizedMonthly * months;
              const upside = optimized - current;

              return (
                <div key={months} className="rounded-xl border-[0.5px] border-white/8 glass p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-medium text-white/90">{months} month forecast</div>
                      <div className="mt-1 text-xs text-white/50">At current registration vs fully optimized</div>
                    </div>
                    <span className="rounded-full bg-[#faeeda] px-3 py-1 text-[11px] font-medium text-[#f0a832]">
                      {formatGapEstimate(upside)} upside
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-white/5 px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">Current</div>
                      <div className="mt-1 text-white/90">{formatMoney(current)}</div>
                    </div>
                    <div className="rounded-lg bg-white/5 px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">Fully optimized</div>
                      <div className="mt-1 text-white/90">{formatMoney(optimized)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#f0a832]">
          Forecasts are directional estimates based on your catalog data. Not financial advice — use as a planning reference.
        </section>

        <Link href="/actions" className="mt-5 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
          Close the gaps
        </Link>
      </main>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-2 text-xl font-normal text-white/90">{value}</div>
    </div>
  );
}
