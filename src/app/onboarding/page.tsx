"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary, seedSongs } from "@/lib/backstage-data";

function GapCountUp({ target }: { target: number }) {
  const motionVal = useMotionValue(0);
  const formatted = useTransform(motionVal, (v) => {
    if (v >= 1000) return `~$${(v / 1000).toFixed(0)}K`;
    return `$${Math.round(v)}`;
  });
  const [display, setDisplay] = useState("$0");

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = formatted.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <>{display}</>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { createSong, updateProfile, songs, profile } = usePocket();
  const summary = getRevenueGapSummary(songs.length ? songs : seedSongs);
  const nextAction = getNextRevenueAction(songs.length ? songs : seedSongs);
  const [step, setStep] = useState(0);
  const [songTitle, setSongTitle] = useState("");
  const [distributor, setDistributor] = useState("DistroKid");
  const [artistName, setArtistName] = useState(profile.artistName ?? "");
  const [role, setRole] = useState(profile.role ?? "");
  const hasSong = songTitle.trim().length > 1;
  const steps = ["Splash", "Artist profile", "Add release", "Connect platform", "The Gap", "Trial"];

  return (
    <AppShell title="Onboarding" eyebrow={steps[step]}>
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <div className="mb-5 flex gap-2">
          {steps.map((item, index) => (
            <div key={item} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-[#0a0a0a]" : "bg-black/10"}`} />
          ))}
        </div>

        {step === 0 ? (
          <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-6 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Pocket Manager</div>
            <h2 className="mt-5 text-5xl font-light tracking-[-0.04em]">Your music. Your money. In control.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
              Add one release, connect one platform, and see the first Gap before you land in the app.
            </p>
            <button type="button" onClick={() => setStep(1)} className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-medium text-black">
              Get started
            </button>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Artist profile</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Who are you as an artist?</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="block text-sm text-[#514d47]">
                <span className="mb-2 block font-medium">Artist name</span>
                <input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your artist or band name"
                  className="w-full rounded-lg border-[0.5px] border-black/15 bg-white px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
                />
              </label>
              <label className="block text-sm text-[#514d47]">
                <span className="mb-2 block font-medium">Role / genre</span>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. R&B artist, producer, singer-songwriter"
                  className="w-full rounded-lg border-[0.5px] border-black/15 bg-white px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
                />
              </label>
              <button
                type="button"
                disabled={!artistName.trim()}
                onClick={() => {
                  updateProfile({ artistName: artistName.trim(), role: role.trim() });
                  setStep(2);
                }}
                className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white disabled:opacity-35"
              >
                Continue
              </button>
              <button type="button" onClick={() => setStep(2)} className="text-sm text-[#6b6b65]">
                Skip for now →
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Step 1 of 3</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Let&apos;s find your music.</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {["Search by song name or ISRC", "Import from DistroKid / TuneCore / CD Baby", "Add manually"].map((item) => (
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
                  setStep(3);
                }}
                className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white disabled:opacity-35"
              >
                Continue
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <div className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Step 2 of 3</div>
              <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Where are your songs distributed?</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">Without connecting, we estimate your gaps but cannot confirm them yet.</p>
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
              <button type="button" onClick={() => setStep(4)} className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
                Reveal The Gap
              </button>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <motion.section
            className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-6 text-white"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Step 3 of 3 · The Gap</div>
            <div className="mt-5 text-6xl font-light tracking-[-0.05em]">
              <GapCountUp target={summary.totalEstimatedGap} />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Estimated uncollected across {summary.songsWithGaps} songs and {summary.activeIncomeStreams} active income streams. Estimates are conservative and not guaranteed.
            </p>
            <div className="mt-5 rounded-lg border-[0.5px] border-white/15 p-4">
              <div className="text-sm text-white">{nextAction.title}</div>
              <div className="mt-2 text-xs text-white/55">
                Gap impact: {formatGapEstimate(nextAction.estimatedValue)} · Time: {nextAction.estimatedTime}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep(5)} className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-black">
                Start collecting →
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
          </motion.section>
        ) : null}

        {step === 5 ? (
          <section className="rounded-xl border-[0.5px] border-black/15 bg-white p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a92]">7-day trial</div>
            <h2 className="mt-3 text-4xl font-light tracking-[-0.03em] text-[#111]">See exactly what you are owed.</h2>
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
