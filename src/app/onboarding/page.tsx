"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary, seedSongs } from "@/lib/backstage-data";

export default function OnboardingPage() {
  const router = useRouter();
  const { createSong, songs } = usePocket();
  const summary = getRevenueGapSummary(songs.length ? songs : seedSongs);
  const nextAction = getNextRevenueAction(songs.length ? songs : seedSongs);
  const [step, setStep] = useState(0);
  const [songTitle, setSongTitle] = useState("");
  const [distributor, setDistributor] = useState("DistroKid");
  const hasSong = songTitle.trim().length > 1;
  const steps = ["Welcome", "Add release", "Connect platform", "Gap reveal", "Trial"];

  return (
    <AppShell title="Onboarding" eyebrow={steps[step]}>
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <div className="mb-5 flex gap-2">
          {steps.map((item, index) => (
            <div key={item} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-[#0a0a0a]" : "bg-black/10"}`} />
          ))}
        </div>

        {step === 0 ? (
          <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-6 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Pocket Manager</div>
            <h2 className="mt-5 text-5xl font-normal tracking-[-0.04em]">Find out what you are owed.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
              Add one release, connect one platform, and Pocket shows the first money path that needs attention.
            </p>
            <button type="button" onClick={() => setStep(1)} className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-medium text-black">
              Get started
            </button>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Add your releases</div>
              <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Add one song to continue.</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {["Search by ISRC", "Import from distributor", "Add manually"].map((item) => (
                <button key={item} type="button" className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-4 text-left text-sm text-[#111]">
                  {item}
                </button>
              ))}
              <input
                value={songTitle}
                onChange={(event) => setSongTitle(event.target.value)}
                placeholder="Song title"
                className="rounded-lg border-[0.5px] border-black/15 bg-white px-4 py-3 text-[#111] outline-none"
              />
              <button
                type="button"
                disabled={!hasSong}
                onClick={() => {
                  createSong({
                    title: songTitle,
                    isrc: "",
                    releaseDate: "",
                    distributor,
                  });
                  setStep(2);
                }}
                className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white disabled:opacity-35"
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Connect one platform</div>
              <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Where are your songs distributed?</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">You can skip, but Pocket may show a checklist instead of a gap estimate.</p>
            </div>
            <div className="mt-5 grid gap-3">
              {["DistroKid", "TuneCore", "CD Baby", "Not sure yet"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDistributor(item)}
                  className={`rounded-xl border-[0.5px] px-4 py-4 text-left text-sm ${
                    distributor === item ? "border-black/30 bg-[#0a0a0a] text-white" : "border-black/15 bg-[#f8f6f1] text-[#111]"
                  }`}
                >
                  {item}
                </button>
              ))}
              <button type="button" onClick={() => setStep(3)} className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
                Reveal first gap
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-6 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Estimated uncollected</div>
            <div className="mt-5 text-6xl font-normal tracking-[-0.05em]">{formatGapEstimate(summary.totalEstimatedGap)}</div>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Across {summary.songsWithGaps} songs and {summary.activeIncomeStreams} active income streams. Estimates are conservative and not guaranteed.
            </p>
            <div className="mt-5 rounded-lg border-[0.5px] border-white/15 p-4">
              <div className="text-sm text-white">{nextAction.title}</div>
              <div className="mt-2 text-xs text-white/55">
                Recovery: {formatGapEstimate(nextAction.estimatedValue)} · Time: {nextAction.estimatedTime}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep(4)} className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-black">
                Start collecting
              </button>
              <Link href="/platforms" className="rounded-lg border-[0.5px] border-white/15 px-5 py-3 text-sm text-white">
                See platform checklist
              </Link>
            </div>
            <div className="mt-5 rounded-lg border-[0.5px] border-white/15 p-4">
              <div className="text-sm text-white">See exactly what you are owed</div>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Free shows the gap. Pro unlocks exact numbers, full action queue, and the 7-day trial path.
              </p>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="rounded-xl border-[0.5px] border-black/15 bg-white p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a92]">7-day trial</div>
            <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em] text-[#111]">See exactly what you are owed.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#6b6b65]">
              Free shows you the gaps. Pro unlocks exact dollar estimates, the full action queue, Release Radar, statements, split sheets, and exports.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => router.push("/settings")} className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
                Start 7-day Pro trial
              </button>
              <button type="button" onClick={() => router.push("/mobile")} className="rounded-lg border-[0.5px] border-black/15 px-5 py-3 text-sm font-medium text-[#111]">
                Continue with Free
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
