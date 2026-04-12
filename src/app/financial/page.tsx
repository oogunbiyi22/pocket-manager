"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, formatMoney, getSongConfirmedIncome, getSongEstimatedGap } from "@/lib/backstage-data";

export default function FinancialPage() {
  const { songs } = usePocket();
  const totalConfirmed = songs.reduce((total, song) => total + getSongConfirmedIncome(song), 0);
  const totalGap = songs.reduce((total, song) => total + getSongEstimatedGap(song), 0);

  return (
    <AppShell title="Financial Summary" eyebrow="Current quarter">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Current quarter</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Confirmed income</div>
              <div className="mt-2 text-5xl font-light tracking-[-0.04em]">{formatMoney(totalConfirmed)}</div>
            </div>
            <div className="rounded-lg border-[0.5px] border-[#faeeda]/60 bg-[#faeeda] px-4 py-3 text-[#854f0b]">
              <div className="text-[11px] uppercase tracking-[0.18em]">Estimated missing</div>
              <div className="mt-2 text-3xl font-normal">{formatGapEstimate(totalGap)}</div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">By song</div>
          <div className="space-y-3">
            {songs.map((song) => (
              <Link
                key={song.id}
                href={`/projects/${song.id}`}
                className="grid gap-3 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4 text-sm transition hover:border-black/35 sm:grid-cols-[1fr_0.8fr_0.8fr]"
              >
                <div>
                  <div className="text-[15px] font-medium text-[#111]">{song.title}</div>
                  <div className="mt-1 text-xs text-[#6b6b65]">{song.releaseDate} · {song.territory}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#6b6b65]">Confirmed</div>
                  <div className="mt-1 text-[#111]">{formatMoney(getSongConfirmedIncome(song))}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#6b6b65]">Missing</div>
                  <div className="mt-1 text-[#854f0b]">{formatGapEstimate(getSongEstimatedGap(song))}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#854f0b]">
          PDF export is a Pro feature in V5. The current prototype shows the Free current-quarter view and keeps exact historical export gated.
        </section>
      </main>
    </AppShell>
  );
}
