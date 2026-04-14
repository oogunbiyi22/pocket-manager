"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary, seedSongs } from "@/lib/backstage-data";

// ─── Count-up ───────────────────────────────────────────────────────────────
function GapCountUp({ target }: { target: number }) {
  const motionVal = useMotionValue(0);
  const formatted = useTransform(motionVal, (v) => {
    if (v >= 1000) return `~$${(v / 1000).toFixed(0)}K`;
    return `$${Math.round(v)}`;
  });
  const [display, setDisplay] = useState("$0");

  useEffect(() => {
    const controls = animate(motionVal, target, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    const unsub = formatted.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <>{display}</>;
}

// ─── Progress dots ──────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "h-1.5 w-4 bg-white"
              : i < current
              ? "size-1.5 bg-white/50"
              : "size-1.5 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const router = useRouter();
  const { createSong, updateProfile, songs, profile } = usePocket();
  const useSeedData = !songs.length;
  const summary = getRevenueGapSummary(useSeedData ? seedSongs : songs);
  const nextAction = getNextRevenueAction(useSeedData ? seedSongs : songs);

  const [step, setStep] = useState(0);
  const [artistName, setArtistName] = useState(profile.artistName ?? "");
  const [role, setRole] = useState(profile.role ?? "");
  const [songTitle, setSongTitle] = useState("");
  const [distributor, setDistributor] = useState("DistroKid");
  const [pro, setPro] = useState("");
  const [gapRevealed, setGapRevealed] = useState(false);

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); }

  return (
    <div className="min-h-screen bg-[#0d0d0b] text-white">
      {/* Progress */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Pocket Manager</div>
        <ProgressDots total={TOTAL_STEPS} current={step} />
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="text-[11px] text-white/30">
            ← Back
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key={step}
          className="mx-auto max-w-md px-5 pb-16 pt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >

          {/* Step 0: Splash */}
          {step === 0 && (
            <div className="flex flex-col gap-8">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Your music. Your money.</div>
                <h1 className="mt-4 text-[48px] font-light leading-[1.05] tracking-[-0.04em]">
                  Close the Gap between what you earn and what you collect.
                </h1>
                <p className="mt-5 text-sm leading-6 text-white/45">
                  Add one release, connect one platform, and see the first Gap in under two minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] transition active:scale-[0.98]"
              >
                Get started
              </button>
              <button type="button" onClick={() => router.push("/home")} className="text-center text-sm text-white/30">
                Already have an account →
              </button>
            </div>
          )}

          {/* Step 1: Artist profile */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Artist profile</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Who are you as an artist?</h2>
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">Artist name</span>
                  <input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your artist or band name"
                    className="h-12 w-full rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">Role</span>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. R&B artist, producer, singer-songwriter"
                    className="h-12 w-full rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!artistName.trim()}
                onClick={() => {
                  updateProfile({ artistName: artistName.trim(), role: role.trim() });
                  next();
                }}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] disabled:opacity-30 transition active:scale-[0.98]"
              >
                Continue
              </button>
              <button type="button" onClick={next} className="text-center text-sm text-white/30">
                Skip for now →
              </button>
            </div>
          )}

          {/* Step 2: Add release */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Step 1 of 4</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Add your first release.</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">One song is enough to show the Gap.</p>
              </div>
              <div className="grid gap-3">
                {["Search by ISRC", "Import from distributor", "Add manually"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 py-3.5 text-left text-sm text-white/65"
                  >
                    {item}
                  </button>
                ))}
                <input
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Song title"
                  className="h-12 rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/25"
                />
              </div>
              <button
                type="button"
                disabled={songTitle.trim().length < 2}
                onClick={() => {
                  createSong({ title: songTitle, isrc: "", releaseDate: "", distributor });
                  next();
                }}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] disabled:opacity-30 transition active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Connect distributor */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Step 2 of 4</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Where is it distributed?</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  Without connecting, we estimate your gaps but cannot confirm them yet.
                </p>
              </div>
              <div className="grid gap-2">
                {["DistroKid", "TuneCore", "CD Baby", "Other", "Not sure yet"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDistributor(item)}
                    className={`flex items-center justify-between rounded-xl border-[0.5px] px-4 py-4 text-left text-sm transition ${
                      distributor === item
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <span>{item}</span>
                    {distributor === item && <span className="text-white/60">✓</span>}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] transition active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 4: PRO registration (new — 7th step) */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Step 3 of 4</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Are you registered with a PRO?</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  PROs collect performance royalties every time your song is played publicly. Missing this = missed money.
                </p>
              </div>
              <div className="grid gap-2">
                {["ASCAP", "BMI", "SESAC", "Other PRO", "Not registered yet"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPro(item)}
                    className={`flex items-center justify-between rounded-xl border-[0.5px] px-4 py-4 text-left text-sm transition ${
                      pro === item
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <span>{item}</span>
                    {pro === item && <span className="text-white/60">✓</span>}
                  </button>
                ))}
              </div>
              {pro === "Not registered yet" && (
                <div className="rounded-xl border-[0.5px] border-[#ef9f27]/40 bg-[#faeeda]/10 px-4 py-3 text-sm text-[#ef9f27]">
                  Registration takes ~5 min and closes the biggest single gap most independent artists have.
                </div>
              )}
              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] transition active:scale-[0.98]"
              >
                {pro ? "Continue" : "Skip for now"}
              </button>
            </div>
          )}

          {/* Step 5: Gap Reveal */}
          {step === 5 && (
            <div className="flex flex-col gap-8">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Step 4 of 4 · The Gap</div>
                <p className="mt-3 text-sm text-white/45">Estimated uncollected royalties across your catalog.</p>
              </div>

              <motion.div
                className="relative overflow-hidden rounded-2xl border-[0.5px] border-white/10 bg-[#1e1e1b] p-6"
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onAnimationComplete={() => setGapRevealed(true)}
              >
                {/* Amber glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(239,159,39,0.12) 0%, transparent 70%)" }} />

                <div className="relative">
                  <motion.div
                    className="text-[64px] font-light leading-none tracking-[-0.05em] text-[#ef9f27]"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    {gapRevealed ? <GapCountUp target={summary.totalEstimatedGap} /> : "$0"}
                  </motion.div>
                  <motion.p
                    className="mt-3 text-sm leading-6 text-white/45"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Estimated uncollected · {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"} ·{" "}
                    {summary.activeIncomeStreams} streams active
                  </motion.p>

                  {/* Next action */}
                  <motion.div
                    className="mt-5 rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">Biggest fix</div>
                    <div className="mt-2 text-sm text-white">{nextAction.action} via {nextAction.collectionBody}</div>
                    <div className="mt-1 text-xs text-white/40">
                      {formatGapEstimate(nextAction.estimatedValue)} · {nextAction.estimatedTime}
                    </div>
                  </motion.div>

                  <p className="mt-4 text-[11px] text-white/20">
                    Conservative estimate. Not guaranteed income. For illustration purposes.
                  </p>
                </div>
              </motion.div>

              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] transition active:scale-[0.98]"
              >
                Start collecting →
              </button>
            </div>
          )}

          {/* Step 6: Trial CTA */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">7-day trial</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">
                  See exactly what you are owed.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  Free shows you the gaps. Pro unlocks exact dollar estimates, the full action queue, Release Radar, statements, split sheets, and exports.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border-[0.5px] border-white/10">
                {[
                  "Exact dollar estimates per stream type",
                  "Full action queue with step-by-step guides",
                  "Release Radar with milestone tracking",
                  "Statement import and royalty analysis",
                  "Split sheet generation and signing",
                ].map((feature, i) => (
                  <div key={feature} className={`flex items-center gap-3 px-4 py-3 text-sm ${i < 4 ? "border-b border-white/[0.06]" : ""}`}>
                    <span className="text-[#97c459]">✓</span>
                    <span className="text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] transition active:scale-[0.98]"
                >
                  Start 7-day Pro trial
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/home")}
                  className="h-14 w-full rounded-2xl border-[0.5px] border-white/15 text-base text-white/70 transition active:scale-[0.98]"
                >
                  Continue with Free
                </button>
              </div>
            </div>
          )}

        </motion.main>
      </AnimatePresence>
    </div>
  );
}
