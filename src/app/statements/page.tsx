"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { formatMoney } from "@/lib/backstage-data";

const starterCsv = `Song,Platform,Territory,Streams,Income
Late Nights,Spotify,United States,340000,120
Late Nights,YouTube,United States,44000,18
Neon Heart,Spotify,United States,126000,54`;

type StatementRow = {
  song: string;
  platform: string;
  territory: string;
  streams: number;
  income: number;
};

export default function StatementsPage() {
  const [statementSource, setStatementSource] = useState("DistroKid");
  const [rawCsv, setRawCsv] = useState(starterCsv);
  const rows = useMemo(() => parseStatementRows(rawCsv), [rawCsv]);
  const totalIncome = rows.reduce((total, row) => total + row.income, 0);
  const totalStreams = rows.reduce((total, row) => total + row.streams, 0);
  const bySong = groupRows(rows, "song");
  const anomalies = getStatementAnomalies(rows);

  return (
    <AppShell title="Statement Reader" eyebrow="Phase 9 preview">
      <main className="mx-auto max-w-5xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Royalty statement reader</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Turn statement rows into catalog income clarity.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            This prototype parses pasted CSV rows. Real uploads, PDF parsing, distributor-specific formats, and background processing belong to the V5 backend.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Import preview</div>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Statement source</span>
                <select
                  value={statementSource}
                  onChange={(event) => setStatementSource(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                >
                  {["DistroKid", "TuneCore", "CD Baby", "ASCAP", "BMI", "SoundExchange"].map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">CSV rows</span>
                <textarea
                  value={rawCsv}
                  onChange={(event) => setRawCsv(event.target.value)}
                  className="min-h-64 w-full rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3 font-mono text-xs leading-5 text-[#111] outline-none"
                />
              </label>
            </div>

            <div className="rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#854f0b]">
              Expected columns: Song, Platform, Territory, Streams, Income. Exact distributor CSV/PDF parsing remains backend work.
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Source" value={statementSource} />
              <Metric label="Income" value={formatMoney(totalIncome)} />
              <Metric label="Streams" value={totalStreams.toLocaleString()} />
            </div>

            <section className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Income by song</div>
              <div className="mt-3 space-y-2">
                {bySong.map((item) => (
                  <div key={item.label} className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[#111]">{item.label}</div>
                        <div className="mt-1 text-xs text-[#6b6b65]">{item.streams.toLocaleString()} streams</div>
                      </div>
                      <div className="text-[#111]">{formatMoney(item.income)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Flags</div>
              <div className="mt-3 space-y-2 text-sm text-[#514d47]">
                {anomalies.length ? anomalies.map((item) => <div key={item}>{item}</div>) : <div>No simple statement flags from this pasted data.</div>}
              </div>
              <Link href="/financial" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Open financial summary
              </Link>
            </section>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function parseStatementRows(rawCsv: string) {
  const lines = rawCsv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [, ...body] = lines;

  return body
    .map((line) => {
      const [song, platform, territory, streams, income] = line.split(",").map((cell) => cell.trim());

      return {
        song: song || "Unknown song",
        platform: platform || "Unknown platform",
        territory: territory || "Unknown territory",
        streams: Number(streams) || 0,
        income: Number(income) || 0,
      };
    })
    .filter((row) => row.song !== "Unknown song" || row.income > 0);
}

function groupRows(rows: StatementRow[], key: "song" | "platform" | "territory") {
  return Object.values(
    rows.reduce<Record<string, { label: string; streams: number; income: number }>>((groups, row) => {
      const label = row[key];
      const current = groups[label] ?? { label, streams: 0, income: 0 };

      groups[label] = {
        label,
        streams: current.streams + row.streams,
        income: current.income + row.income,
      };

      return groups;
    }, {}),
  ).sort((left, right) => right.income - left.income);
}

function getStatementAnomalies(rows: StatementRow[]) {
  const anomalies: string[] = [];

  rows.forEach((row) => {
    if (row.streams > 10000 && row.income <= 0) {
      anomalies.push(`${row.song}: ${row.platform} has streams but no income.`);
    }

    if (row.streams > 0 && row.income / row.streams < 0.0005) {
      anomalies.push(`${row.song}: ${row.platform} payout looks unusually low for the pasted stream count.`);
    }
  });

  return anomalies;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b6b65]">{label}</div>
      <div className="mt-2 text-xl font-normal text-[#111]">{value}</div>
    </div>
  );
}
