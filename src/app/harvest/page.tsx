"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, formatMoney, getRevenueGapSummary } from "@/lib/backstage-data";

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
