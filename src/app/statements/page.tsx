"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { useSessionState, clearSessionState } from "@/lib/use-session-state";
import { formatMoney } from "@/lib/backstage-data";

// Per-distributor column header mappings
// Maps distributor name → { song, platform, territory, streams, income } column headers
const DISTRIBUTOR_COLUMNS: Record<string, { song: string; platform: string; territory: string; streams: string; income: string }> = {
  DistroKid:    { song: "Title",        platform: "Store",        territory: "Country of Sale", streams: "Streams",       income: "Earnings (USD)" },
  TuneCore:     { song: "Track Name",   platform: "Store",        territory: "Country",          streams: "Streams",       income: "Royalties" },
  "CD Baby":    { song: "Title",        platform: "Store Name",   territory: "Country",          streams: "Quantity",      income: "Net Earnings" },
  ASCAP:        { song: "Work Title",   platform: "Society",      territory: "Country",          streams: "Performances",  income: "Royalty Amount" },
  BMI:          { song: "Title",        platform: "Payment Type", territory: "Country",          streams: "Performances",  income: "Amount" },
  SoundExchange: { song: "Sound Recording Title", platform: "Service", territory: "Country",    streams: "Plays",         income: "Royalties" },
};

type StatementRow = {
  song: string;
  platform: string;
  territory: string;
  streams: number;
  income: number;
};

export default function StatementsPage() {
  const [statementSource, setStatementSource] = useState("DistroKid");
  const [rawCsv, setRawCsv] = useSessionState("pm-statements-csv", "");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useSessionState<string | null>("pm-statements-filename", null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colMap = DISTRIBUTOR_COLUMNS[statementSource] ?? DISTRIBUTOR_COLUMNS.DistroKid;
  const rows = useMemo(() => parseStatementRows(rawCsv, colMap), [rawCsv, colMap]);
  const totalIncome = rows.reduce((total, row) => total + row.income, 0);
  const totalStreams = rows.reduce((total, row) => total + row.streams, 0);
  const bySong = groupRows(rows, "song");
  const anomalies = getStatementAnomalies(rows);

  function loadFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawCsv((e.target?.result as string) ?? "");
    };
    reader.readAsText(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  return (
    <AppShell title="Statement Reader" eyebrow="Income statements">
      <main className="mx-auto max-w-5xl rounded-[24px] border-[0.5px] border-white/10 glass p-5 text-white/90">
        <section className="rounded-xl border-[0.5px] border-white/10 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Royalty statement reader</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Turn royalty statements into clear income breakdowns.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Drop or paste your CSV export from DistroKid, TuneCore, CD Baby, ASCAP, BMI, or SoundExchange. See income by song, platform, and territory instantly.
          </p>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Import statement</div>
              <label className="mt-4 block text-sm text-white/60">
                <span className="mb-2 block">Statement source</span>
                <select
                  value={statementSource}
                  onChange={(event) => { setStatementSource(event.target.value); setRawCsv(""); setFileName(null); }}
                  className="h-12 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                >
                  {Object.keys(DISTRIBUTOR_COLUMNS).map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </select>
              </label>

              {/* File upload drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-4 cursor-pointer rounded-xl border-[0.5px] p-6 text-center transition ${
                  dragOver
                    ? "border-[#ef9f27] bg-[#faeeda]/40"
                    : fileName
                    ? "border-[#97c459] bg-[#97c459]/10/40"
                    : "border-dashed border-white/12 bg-white hover:bg-white/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {fileName ? (
                  <>
                    <div className="text-2xl">✓</div>
                    <div className="mt-1 text-sm font-medium text-[#97c459]">{fileName}</div>
                    <div className="mt-0.5 text-xs text-white/50">{rows.length} rows parsed</div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setRawCsv(""); setFileName(null); clearSessionState("pm-statements-csv", "pm-statements-filename"); }}
                      className="mt-2 text-xs text-white/50 underline"
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-2xl">📂</div>
                    <div className="mt-1 text-sm text-white/40">Drop CSV here or click to browse</div>
                    <div className="mt-0.5 text-xs text-white/50">.csv · .tsv · .txt</div>
                  </>
                )}
              </div>

              {/* Or paste */}
              <label className="mt-4 block text-sm text-white/60">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.15em] text-white/50">Or paste CSV rows</span>
                <textarea
                  value={rawCsv}
                  onChange={(event) => { setRawCsv(event.target.value); setFileName(null); }}
                  placeholder={`${colMap.song},${colMap.platform},${colMap.territory},${colMap.streams},${colMap.income}\nYour Song,Spotify,US,50000,21.50`}
                  className="min-h-40 w-full rounded-xl border-[0.5px] border-white/10 bg-white/[0.06] px-4 py-3 font-mono text-xs leading-5 text-white/90 outline-none placeholder:text-white/50/60"
                />
              </label>
            </div>

            <div className="rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#ef9f27]">
              Expected headers for <strong>{statementSource}</strong>: {colMap.song} · {colMap.platform} · {colMap.territory} · {colMap.streams} · {colMap.income}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Source" value={statementSource} />
              <Metric label="Income" value={formatMoney(totalIncome)} />
              <Metric label="Streams" value={totalStreams.toLocaleString()} />
            </div>

            <section className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Income by song</div>
              <div className="mt-3 space-y-2">
                {bySong.map((item) => (
                  <div key={item.label} className="rounded-lg border-[0.5px] border-white/8 bg-white/[0.06] px-3 py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white/90">{item.label}</div>
                        <div className="mt-1 text-xs text-white/50">{item.streams.toLocaleString()} streams</div>
                      </div>
                      <div className="text-white/90">{formatMoney(item.income)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Flags</div>
              <div className="mt-3 space-y-2 text-sm text-white/60">
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

function parseStatementRows(
  rawCsv: string,
  colMap: { song: string; platform: string; territory: string; streams: string; income: string },
) {
  const lines = rawCsv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Detect delimiter
  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));

  // Try to find columns by distributor mapping first, fall back to generic names
  function colIndex(preferred: string, fallbacks: string[]): number {
    const idx = headers.findIndex((h) => h.toLowerCase() === preferred.toLowerCase());
    if (idx !== -1) return idx;
    for (const fb of fallbacks) {
      const fi = headers.findIndex((h) => h.toLowerCase().includes(fb.toLowerCase()));
      if (fi !== -1) return fi;
    }
    return -1;
  }

  const songIdx     = colIndex(colMap.song,      ["title", "song", "track", "work"]);
  const platformIdx = colIndex(colMap.platform,  ["store", "service", "platform", "society"]);
  const territoryIdx= colIndex(colMap.territory, ["country", "territory", "region"]);
  const streamsIdx  = colIndex(colMap.streams,   ["stream", "play", "performance", "qty", "quantity"]);
  const incomeIdx   = colIndex(colMap.income,    ["earn", "royalt", "income", "amount", "net"]);

  return lines.slice(1)
    .map((line) => {
      const cells = line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        song:      cells[songIdx]      ?? "Unknown",
        platform:  cells[platformIdx]  ?? "Unknown",
        territory: cells[territoryIdx] ?? "Unknown",
        streams:   Number(cells[streamsIdx]?.replace(/,/g, ""))  || 0,
        income:    Number(cells[incomeIdx]?.replace(/[$,]/g, "")) || 0,
      };
    })
    .filter((row) => row.song !== "Unknown" || row.income > 0);
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
    <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-2 text-xl font-normal text-white/90">{value}</div>
    </div>
  );
}
