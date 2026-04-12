"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";

const starterContract = `Producer grants Artist an exclusive license in perpetuity throughout the universe.
Producer waives audit rights and agrees that royalties may be recouped from all income.
No reversion clause is included.`;

type ContractFlag = {
  label: string;
  risk: "Low" | "Medium" | "High";
  excerpt: string;
  plainEnglish: string;
  attorneyQuestion: string;
};

export default function ContractsPage() {
  const [contractType, setContractType] = useState("Producer agreement");
  const [contractText, setContractText] = useState(starterContract);
  const flags = useMemo(() => scanContract(contractText), [contractText]);
  const risk = flags.some((flag) => flag.risk === "High") ? "High" : flags.some((flag) => flag.risk === "Medium") ? "Medium" : "Low";

  return (
    <AppShell title="Contract Scanner" eyebrow="Phase 10 preview">
      <main className="mx-auto max-w-5xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Legal awareness</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Spot clauses that deserve a real attorney attention.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            This prototype uses simple local rule checks. V5 contract scanning with Claude and PDF upload is not implemented yet.
          </p>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#fcebeb] bg-[#fcebeb] p-4 text-sm leading-6 text-[#a32d2d]">
          This is not legal advice. Consult an entertainment attorney before signing.
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Contract text</div>
              <label className="mt-4 block text-sm text-[#514d47]">
                <span className="mb-2 block">Type</span>
                <select
                  value={contractType}
                  onChange={(event) => setContractType(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-white px-3 text-sm text-[#111] outline-none"
                >
                  {["Producer agreement", "Split sheet", "Management deal", "Record deal", "Sync deal"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <textarea
                value={contractText}
                onChange={(event) => setContractText(event.target.value)}
                className="mt-4 min-h-80 w-full rounded-xl border-[0.5px] border-black/15 bg-white px-4 py-3 text-sm leading-6 text-[#111] outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Type" value={contractType} />
              <Metric label="Risk" value={risk} />
              <Metric label="Flags" value={`${flags.length}`} />
            </div>

            <section className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Flagged clauses</div>
              <div className="mt-3 space-y-3">
                {flags.length ? (
                  flags.map((flag) => (
                    <article key={`${flag.label}-${flag.excerpt}`} className="rounded-lg border-[0.5px] border-black/10 bg-white p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[#111]">{flag.label}</div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${riskClass(flag.risk)}`}>{flag.risk}</span>
                      </div>
                      <div className="mt-3 rounded-lg bg-[#f8f6f1] p-3 text-xs leading-5 text-[#514d47]">{flag.excerpt}</div>
                      <p className="mt-3 text-sm leading-6 text-[#514d47]">{flag.plainEnglish}</p>
                      <p className="mt-2 text-xs leading-5 text-[#854f0b]">Ask your attorney: {flag.attorneyQuestion}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg border-[0.5px] border-dashed border-black/20 bg-white p-3 text-sm text-[#6b6b65]">
                    No basic rule-based flags found in this text.
                  </div>
                )}
              </div>
              <Link href="/settings" className="mt-4 inline-flex rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Back to profile
              </Link>
            </section>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function scanContract(text: string) {
  const rules = [
    {
      pattern: /perpetuity|forever|throughout the universe/i,
      label: "Long or unlimited term",
      risk: "High" as const,
      plainEnglish: "The contract may last indefinitely or cover an extremely broad territory.",
      attorneyQuestion: "Can this term be limited, and is there a reversion clause?",
    },
    {
      pattern: /waives? audit|no audit/i,
      label: "Audit rights limited",
      risk: "High" as const,
      plainEnglish: "You may be giving up the right to inspect royalty/accounting records.",
      attorneyQuestion: "Do I keep audit rights and how often can I use them?",
    },
    {
      pattern: /recoup/i,
      label: "Recoupment language",
      risk: "Medium" as const,
      plainEnglish: "Money may be deducted before you receive royalties or income.",
      attorneyQuestion: "Exactly what costs are recoupable and from which income streams?",
    },
    {
      pattern: /no reversion|without reversion/i,
      label: "Missing reversion",
      risk: "High" as const,
      plainEnglish: "Rights may not return to you even if the deal stops performing.",
      attorneyQuestion: "What triggers rights returning to me?",
    },
    {
      pattern: /exclusive/i,
      label: "Exclusive rights",
      risk: "Medium" as const,
      plainEnglish: "You may be unable to license or use the work elsewhere.",
      attorneyQuestion: "What exactly is exclusive, for how long, and in which territory?",
    },
  ];

  return rules
    .filter((rule) => rule.pattern.test(text))
    .map<ContractFlag>((rule) => ({
      label: rule.label,
      risk: rule.risk,
      excerpt: getExcerpt(text, rule.pattern),
      plainEnglish: rule.plainEnglish,
      attorneyQuestion: rule.attorneyQuestion,
    }));
}

function getExcerpt(text: string, pattern: RegExp) {
  const match = text.match(pattern);

  if (match?.index === undefined) {
    return text.slice(0, 180);
  }

  return text.slice(Math.max(0, match.index - 60), match.index + 160).trim();
}

function riskClass(risk: ContractFlag["risk"]) {
  if (risk === "High") return "bg-[#fcebeb] text-[#a32d2d]";
  if (risk === "Medium") return "bg-[#faeeda] text-[#854f0b]";
  return "bg-[#eaf3de] text-[#3b6d11]";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6b6b65]">{label}</div>
      <div className="mt-2 text-xl font-normal text-[#111]">{value}</div>
    </div>
  );
}
