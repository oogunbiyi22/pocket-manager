"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { MoneyHealth } from "@/components/money-health";
import { formatGapEstimate, formatMoney, getSongConfirmedIncome, getSongEstimatedGap } from "@/lib/backstage-data";

export default function FinancialPage() {
  const { songs } = usePocket();
  const [copied, setCopied] = useState(false);
  const totalConfirmed = songs.reduce((total, song) => total + getSongConfirmedIncome(song), 0);
  const totalGap = songs.reduce((total, song) => total + getSongEstimatedGap(song), 0);
  const streamRows = songs.flatMap((song) =>
    song.revenueStreams.map((stream) => ({
      songId: song.id,
      songTitle: song.title,
      territory: song.territory,
      streamLabel: stream.label,
      collectionBody: stream.collectionBody,
      status: stream.status.replaceAll("_", " "),
      confirmed: stream.actualAmount,
      missing: stream.estimatedGap,
    })),
  );
  const exportText = useMemo(
    () =>
      [
        "Pocket Manager financial summary preview",
        "Period: current quarter",
        `Confirmed income: ${formatMoney(totalConfirmed)}`,
        `Estimated missing: ${formatGapEstimate(totalGap)}`,
        "",
        ...songs.map(
          (song) =>
            `${song.title} | ${song.territory} | confirmed ${formatMoney(getSongConfirmedIncome(song))} | missing ${formatGapEstimate(getSongEstimatedGap(song))}`,
        ),
        "",
        "Copy and share with your accountant or financial team.",
      ].join("\n"),
    [songs, totalConfirmed, totalGap],
  );

  async function copySummary() {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
  }

  return (
    <AppShell title="Financial Summary" eyebrow="Current quarter">
      <main className="mx-auto max-w-4xl space-y-6">

        {/* Money Health — fix your money action center */}
        <MoneyHealth />

        <div className="rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
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

        <section className="mt-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">By collection path</div>
          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1]">
            {streamRows.map((row) => (
              <Link
                key={`${row.songId}-${row.streamLabel}-${row.collectionBody}`}
                href={`/projects/${row.songId}`}
                className="grid gap-3 border-b-[0.5px] border-black/10 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_0.8fr_0.7fr_0.7fr]"
              >
                <div>
                  <div className="text-[#111]">{row.collectionBody}</div>
                  <div className="mt-1 text-xs text-[#6b6b65]">{row.songTitle} · {row.territory}</div>
                </div>
                <div>
                  <div className="text-[#514d47]">{row.streamLabel}</div>
                  <div className="mt-1 text-xs text-[#6b6b65]">{row.status}</div>
                </div>
                <div className="text-[#111]">{formatMoney(row.confirmed)}</div>
                <div className="text-[#854f0b]">{formatGapEstimate(row.missing)}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Export preview</div>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border-[0.5px] border-black/10 bg-white p-3 text-xs leading-5 text-[#514d47]">
            {exportText}
          </pre>
          <button type="button" onClick={copySummary} className="mt-3 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
            {copied ? "Copied" : "Copy summary"}
          </button>
          <Link href="/statements" className="ml-2 mt-3 inline-flex rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
            Read statement
          </Link>
          <Link href="/forecast" className="ml-2 mt-3 inline-flex rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
            Forecast income
          </Link>
        </section>

        </div>
      </main>
    </AppShell>
  );
}
