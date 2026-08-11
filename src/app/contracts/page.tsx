"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSessionState } from "@/lib/use-session-state";

const starterContract = ``;

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type ContractFlag = {
  label: string;
  risk: RiskLevel;
  excerpt: string;
  plainEnglish: string;
  attorneyQuestion: string;
};

type AIAnalysis = {
  summary: string;
  overallRisk: RiskLevel;
  flags: ContractFlag[];
  positives: string[];
  nextSteps: string[];
};

export default function ContractsPage() {
  // Pasted contract + type survive refresh so a long paste isn't lost.
  const [contractType, setContractType] = useSessionState("pm-contract-type", "Producer agreement");
  const [contractText, setContractText] = useSessionState("pm-contract-text", starterContract);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const flags = useMemo(() => scanContract(contractText), [contractText]);
  const risk: RiskLevel = flags.some((flag) => flag.risk === "High") ? "High" : flags.some((flag) => flag.risk === "Medium") ? "Medium" : "Low";

  async function runAiScan() {
    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);
    try {
      const res = await fetch("/api/v1/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: contractText, contractType }),
      });
      const data = await res.json() as { analysis?: AIAnalysis; error?: string };
      if (!res.ok || data.error) {
        setAiError(data.error ?? "Analysis failed");
      } else if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch {
      setAiError("Network error — please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <AppShell title="Contract Scanner" eyebrow="Legal awareness">
      <main className="mx-auto max-w-5xl rounded-[24px] border-[0.5px] border-white/10 glass p-5 text-white/90">
        <section className="rounded-xl border-[0.5px] border-white/10 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Legal awareness</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Spot clauses that deserve an attorney&apos;s attention before you sign.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Paste your contract text to flag risky clauses — unlimited terms, missing reversions, audit waivers, and more.
          </p>
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#f05c5c]/20 bg-[#f05c5c]/10 p-4 text-sm leading-6 text-[#f05c5c]">
          This is not legal advice. Consult an entertainment attorney before signing.
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Contract text</div>
              <label className="mt-4 block text-sm text-white/60">
                <span className="mb-2 block">Type</span>
                <select
                  value={contractType}
                  onChange={(event) => setContractType(event.target.value)}
                  className="h-12 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                >
                  {["Producer agreement", "Split sheet", "Management deal", "Record deal", "Sync deal"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <textarea
                value={contractText}
                onChange={(event) => { setContractText(event.target.value); setAiAnalysis(null); }}
                placeholder="Paste your contract text here — producer agreement, management deal, split sheet, sync deal, or anything else you need reviewed."
                className="mt-4 min-h-80 w-full rounded-xl border-[0.5px] border-white/10 bg-white/8 px-4 py-3 text-sm leading-6 text-white/90 outline-none placeholder:text-white/25"
              />
              <button
                onClick={runAiScan}
                disabled={aiLoading || contractText.length < 50}
                className="mt-4 w-full rounded-xl bg-[#0a0a0a] px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {aiLoading ? "Analyzing…" : "AI Deep Scan"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Type" value={contractType} />
              <Metric label="Risk" value={aiAnalysis?.overallRisk ?? risk} />
              <Metric label="Flags" value={`${(aiAnalysis?.flags ?? flags).length}`} />
            </div>

            {aiError && (
              <div className="rounded-xl border-[0.5px] border-[#f05c5c]/20 bg-[#f05c5c]/10 p-3 text-sm text-[#f05c5c]">{aiError}</div>
            )}

            {aiAnalysis && (
              <>
                <section className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">AI Summary</div>
                  <p className="mt-3 text-sm leading-6 text-white/60">{aiAnalysis.summary}</p>
                </section>
                {aiAnalysis.positives.length > 0 && (
                  <section className="rounded-xl border-[0.5px] border-[#eaf3de] bg-[#97c459]/10 p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#97c459]">Artist-Friendly Clauses</div>
                    <ul className="mt-3 space-y-1">
                      {aiAnalysis.positives.map((p, i) => <li key={i} className="text-sm leading-5 text-[#97c459]">• {p}</li>)}
                    </ul>
                  </section>
                )}
                {aiAnalysis.nextSteps.length > 0 && (
                  <section className="rounded-xl border-[0.5px] border-white/10 glass p-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Next Steps</div>
                    <ol className="mt-3 space-y-1">
                      {aiAnalysis.nextSteps.map((s, i) => <li key={i} className="text-sm leading-5 text-white/60">{i + 1}. {s}</li>)}
                    </ol>
                  </section>
                )}
              </>
            )}

            <section className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
                {aiAnalysis ? "AI-Detected Flags" : "Quick-Scan Flags"}
              </div>
              <div className="mt-3 space-y-3">
                {(aiAnalysis?.flags ?? flags).length ? (
                  (aiAnalysis?.flags ?? flags).map((flag) => (
                    <article key={`${flag.label}-${flag.excerpt}`} className="rounded-lg border-[0.5px] border-white/8 glass p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-white/90">{flag.label}</div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${riskClass(flag.risk)}`}>{flag.risk}</span>
                      </div>
                      <div className="mt-3 rounded-lg bg-white/5 p-3 text-xs leading-5 text-white/60">{flag.excerpt}</div>
                      <p className="mt-3 text-sm leading-6 text-white/60">{flag.plainEnglish}</p>
                      <p className="mt-2 text-xs leading-5 text-[#ef9f27]">Ask your attorney: {flag.attorneyQuestion}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg border-[0.5px] border-dashed border-white/12 glass p-3 text-sm text-white/50">
                    {aiAnalysis ? "No risky clauses detected." : "No quick-scan flags found. Run AI Deep Scan for full analysis."}
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
  if (risk === "Critical") return "bg-[#1a0000] text-[#ff4d4d]";
  if (risk === "High") return "bg-[#f05c5c]/10 text-[#f05c5c]";
  if (risk === "Medium") return "bg-[#faeeda] text-[#ef9f27]";
  return "bg-[#97c459]/10 text-[#97c459]";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-2 text-xl font-normal text-white/90">{value}</div>
    </div>
  );
}
