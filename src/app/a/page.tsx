"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary } from "@/lib/backstage-data";

const modelStrategy = [
  {
    label: "Default",
    title: "Cost-smart manager chat",
    detail: "Use a fast, low-cost model for daily catalog questions, next actions, and short guidance.",
  },
  {
    label: "Escalate",
    title: "Hard calls only",
    detail: "Use a stronger model for contracts, messy statements, high-stakes strategy, and long context.",
  },
  {
    label: "Fallback",
    title: "Never single-vendor",
    detail: "Keep provider switching available so A stays reliable if pricing, latency, or quality shifts.",
  },
];

export default function APage() {
  const { songs, profile } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
  const topSong = songs[0];
  const [draft, setDraft] = useState("");
  const [sentPrompt, setSentPrompt] = useState("Yes, walk me through it.");

  return (
    <AppShell title="A" eyebrow="Manager">
      <main className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">
          <header className="flex items-center justify-between border-b-[0.5px] border-white/10 bg-[#0d0d0b] px-5 py-4">
            <div>
              <div className="text-[15px] font-medium text-white">A</div>
              <div className="mt-1 text-xs text-white/35">Your manager · Always on</div>
            </div>
            <Link href="/mobile" className="text-2xl font-light text-white/35" aria-label="Close A">
              ×
            </Link>
          </header>

          <div className="min-h-[440px] px-5 py-5">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
            <div className="max-w-[85%] rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white/80">
              Your biggest gap right now is {nextAction.collectionBody}. {topSong ? `${topSong.title} is the record to fix first.` : "Your catalog has one clear fix first."} That is about {formatGapEstimate(nextAction.estimatedValue)} sitting uncollected. Takes {nextAction.estimatedTime}. Want me to walk you through it?
            </div>

            <div className="mt-4 flex justify-end">
              <div className="max-w-[82%] rounded-xl rounded-br-sm bg-white px-4 py-3 text-sm leading-6 text-[#0d0d0b]">
                {sentPrompt}
              </div>
            </div>

            <div className="mt-4 mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
            <div className="max-w-[88%] rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white/80">
              Step 1 — open the right registration path and keep this song’s ISRC ready. I already have the catalog context. Start with the action page, then mark it complete when the registration is submitted.
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["What is my biggest gap?", "Walk me through it", "Show the ISRC", "What should I fix next?"].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setSentPrompt(prompt)}
                  className="rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] px-3 py-2 text-xs text-white/65"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form
            className="flex items-center gap-2 border-t-[0.5px] border-white/10 bg-[#0d0d0b] px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              const cleanDraft = draft.trim();
              if (cleanDraft) {
                setSentPrompt(cleanDraft);
                setDraft("");
              }
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask A anything..."
              className="h-10 flex-1 rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 text-sm text-white outline-none placeholder:text-white/30"
            />
            <button type="submit" className="grid size-10 place-items-center rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] text-sm text-white/70">
              →
            </button>
          </form>
        </section>

        <aside className="rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
          <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Manager context</div>
            <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">A knows the account first.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              {profile.artistName}, your catalog has {formatGapEstimate(summary.totalEstimatedGap)} estimated missing across {summary.songsWithGaps} songs.
            </p>
          </section>

          <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Top move</div>
            <p className="mt-3 text-sm leading-6 text-[#111]">
              {nextAction.title}. Gap impact: {formatGapEstimate(nextAction.estimatedValue)}. Time: {nextAction.estimatedTime}.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/projects/${nextAction.songId}`} className="rounded-lg bg-[#0d0d0b] px-4 py-2 text-sm text-white">
                Open Room
              </Link>
              <Link href="/actions" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
                See queue
              </Link>
            </div>
          </section>

          <section className="mt-5 rounded-xl border-[0.5px] border-[#e6f1fb] bg-[#e6f1fb] p-4 text-sm leading-6 text-[#185fa5]">
            A is model-provider agnostic. Use a cost-smart default for normal manager chat, then escalate only when the job needs deeper reasoning or document analysis.
          </section>

          <section className="mt-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Model strategy</div>
            <div className="space-y-3">
              {modelStrategy.map((item) => (
                <div key={item.label} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[15px] font-medium text-[#111]">{item.title}</div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6b6b65]">{item.label}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#514d47]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </AppShell>
  );
}
