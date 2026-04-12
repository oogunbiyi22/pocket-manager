"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary } from "@/lib/backstage-data";

export default function SignInPage() {
  const router = useRouter();
  const { profile, signIn, signedIn, songs } = usePocket();
  const [email, setEmail] = useState("artist@pocketmanager.app");
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);

  return (
    <AppShell title="Early Access" eyebrow="Creator revenue intelligence">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Pocket Manager beta</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Find missing revenue paths before they stay missing.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Local beta access is enabled for this prototype. The v1 product path starts with songs, platforms, gaps, and one next action.
          </p>
        </section>

        <section className="mt-5 grid gap-4">
          <label className="block text-sm text-[#514d47]">
            <span className="mb-2 block">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
            />
          </label>

          <div className="rounded-xl border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27]/20 p-4 text-sm leading-6 text-[#854f0b]">
            {signedIn
              ? `Signed in as ${profile.artistName}.`
              : `${summary.songsWithGaps} songs have estimated uncollected revenue. The first action is ${nextAction.title}.`}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">Estimated missing</div>
              <div className="mt-2 text-3xl font-normal">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            </div>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-4">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">Next action</div>
              <div className="mt-2 text-sm leading-6">{nextAction.action}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={() => {
                signIn(email);
                router.push("/onboarding");
              }}
              className="rounded-lg bg-[#0a0a0a] px-5 py-3 font-medium text-white transition hover:bg-black/80"
            >
              Start beta setup
            </button>
            <Link href="/mobile" className="rounded-lg border-[0.5px] border-black/15 px-5 py-3 text-[#111] transition hover:bg-[#f8f6f1]">
              Open app
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
