"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePocket } from "@/components/pocket-provider";
import { LogoMark } from "@/components/logo";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary } from "@/lib/backstage-data";

// ─── Count-up ───────────────────────────────────────────────────────────────
function GapCountUp({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = target / 30;
    const id = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(Math.round(v));
      if (v >= target) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [target]);
  if (val >= 1000) return <>~${(val / 1000).toFixed(0)}K</>;
  return <>${val}</>;
}

// ─── Progress indicator ──────────────────────────────────────────────────────
function ProgressBar({ total, current }: { total: number; current: number }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-0.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-white/50 transition-all duration-350 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[11px] text-white/30">{current + 1}/{total}</span>
    </div>
  );
}

const TOTAL_STEPS = 7;

type AddMode = "manual" | "isrc" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { createSong, updateProfile, completeOnboarding, songs, profile, signedIn } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);

  const [step, setStep] = useState(0);
  const [artistName, setArtistName] = useState(profile.artistName ?? "");
  const [role, setRole] = useState(profile.role ?? "");
  const [songTitle, setSongTitle] = useState("");
  const [isrc, setIsrc] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [distributor, setDistributor] = useState("DistroKid");
  const [pro, setPro] = useState("");
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [gapRevealed, setGapRevealed] = useState(false);

  useEffect(() => {
    if (signedIn && profile.onboarded) {
      router.replace("/home");
    }
  }, [profile.onboarded, router, signedIn]);

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  return (
    <div className="min-h-screen bg-[#0d0d0b] text-white">

      {/* Progress header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.06]">
        <LogoMark size={28} />
        <div className="flex-1">
          <ProgressBar total={TOTAL_STEPS} current={step} />
        </div>
        {step > 0 ? (
          <button type="button" onClick={back} className="text-[11px] text-white/30 shrink-0 press">
            ← Back
          </button>
        ) : (
          <div className="w-10 shrink-0" />
        )}
      </div>

      <main key={step} className="mx-auto max-w-md px-5 pb-16 pt-8" style={{ animation: "onbFadeIn 0.28s ease-out both" }}>
        <style>{`@keyframes onbFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* ── Step 0: Splash ─────────────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Your music. Your money.</div>
                <h1 className="mt-4 text-[44px] font-light leading-[1.05] tracking-[-0.04em]">
                  Close the Gap between what you earn and what you collect.
                </h1>
                <p className="mt-5 text-sm leading-7 text-white/45">
                  Add one release, connect one platform, and see your first Gap in under 2 minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] press"
              >
                Get started
              </button>
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="text-center text-sm text-white/30 press"
              >
                Already have an account? Sign in →
              </button>
            </div>
          )}

          {/* ── Step 1: Artist profile ─────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Artist profile</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Who are you as an artist?</h2>
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Artist name</span>
                  <input
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your artist or band name"
                    maxLength={120}
                    className="h-12 w-full rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">What you do</span>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. R&B artist, producer, singer-songwriter"
                    maxLength={120}
                    className="h-12 w-full rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
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
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] disabled:opacity-30 press"
              >
                Continue
              </button>
              <button type="button" onClick={next} className="text-center text-sm text-white/30 press">
                Skip for now →
              </button>
            </div>
          )}

          {/* ── Step 2: Add release ────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Step 1 of 4 · Add a release</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Add your first release.</h2>
                <p className="mt-3 text-sm leading-7 text-white/45">One song is enough to reveal The Gap.</p>
              </div>

              {/* Mode selection */}
              {addMode === null && (
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMode("isrc")}
                    className="flex items-center justify-between rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-white/70 press"
                  >
                    <div>
                      <div className="font-medium text-white">Search by ISRC</div>
                      <div className="mt-0.5 text-xs text-white/40">Fastest — pull song data automatically</div>
                    </div>
                    <span className="text-white/30">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("manual")}
                    className="flex items-center justify-between rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 py-4 text-left text-sm text-white/70 press"
                  >
                    <div>
                      <div className="font-medium text-white">Add manually</div>
                      <div className="mt-0.5 text-xs text-white/40">Enter title, date, and details yourself</div>
                    </div>
                    <span className="text-white/30">→</span>
                  </button>
                </div>
              )}

              {/* ISRC lookup */}
              {addMode === "isrc" && (
                <div className="grid gap-3">
                  <div className="rounded-xl border-[0.5px] border-[#ef9f27]/30 bg-[#ef9f27]/10 px-4 py-3 text-sm text-[#ef9f27]">
                    Enter your ISRC code — find it in your distributor dashboard or on Spotify/Apple Music.
                  </div>
                  <input
                    value={isrc}
                    onChange={(e) => setIsrc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    placeholder="e.g. USRC17607839"
                    maxLength={12}
                    className="h-12 rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 font-mono text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                  {isrc.length > 0 && isrc.length < 12 && (
                    <p className="text-[11px] text-white/30">ISRC is 12 characters — {12 - isrc.length} more needed</p>
                  )}
                  <input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Song title (required)"
                    maxLength={200}
                    className="h-12 rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMode(null)}
                      className="h-11 rounded-xl border-[0.5px] border-white/10 text-sm text-white/50 press"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={!songTitle.trim()}
                      onClick={() => {
                        createSong({ title: songTitle.trim(), isrc: isrc.trim(), releaseDate, distributor });
                        next();
                      }}
                      className="h-11 rounded-xl bg-white text-sm font-medium text-[#0d0d0b] disabled:opacity-30 press"
                    >
                      Add song →
                    </button>
                  </div>
                </div>
              )}

              {/* Manual entry */}
              {addMode === "manual" && (
                <div className="grid gap-3">
                  <input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Song title *"
                    maxLength={200}
                    className="h-12 rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                  <input
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    placeholder="Release date (e.g. 2024-03-15)"
                    type="date"
                    className="h-12 rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-white/25 focus:border-white/30 [color-scheme:dark]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddMode(null)}
                      className="h-11 rounded-xl border-[0.5px] border-white/10 text-sm text-white/50 press"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={songTitle.trim().length < 2}
                      onClick={() => {
                        createSong({ title: songTitle.trim(), isrc: "", releaseDate, distributor });
                        next();
                      }}
                      className="h-11 rounded-xl bg-white text-sm font-medium text-[#0d0d0b] disabled:opacity-30 press"
                    >
                      Add song →
                    </button>
                  </div>
                </div>
              )}

              {addMode === null && (
                <button type="button" onClick={next} className="text-center text-sm text-white/30 press">
                  Skip for now →
                </button>
              )}
            </div>
          )}

          {/* ── Step 3: Connect distributor ────────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Step 2 of 4 · Distribution</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Where is it distributed?</h2>
                <p className="mt-3 text-sm leading-7 text-white/45">
                  Your distributor controls your base streaming income. Without this connected, we estimate gaps but can&apos;t confirm them.
                </p>
              </div>
              <div className="grid gap-2">
                {[
                  { id: "DistroKid", hint: "Flat annual fee, keeps 0%" },
                  { id: "TuneCore", hint: "Annual fee, keeps 0%" },
                  { id: "CD Baby", hint: "One-time fee, keeps 9%" },
                  { id: "ONErpm", hint: "Free tier + revenue share" },
                  { id: "Other", hint: "Another distributor" },
                  { id: "Not sure yet", hint: "Skip for now" },
                ].map(({ id, hint }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDistributor(id)}
                    className={`flex items-center justify-between rounded-xl border-[0.5px] px-4 py-4 text-left text-sm transition press ${
                      distributor === id
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <div>
                      <div className={distributor === id ? "font-medium" : ""}>{id}</div>
                      <div className="mt-0.5 text-[11px] opacity-50">{hint}</div>
                    </div>
                    {distributor === id && <span className="text-[#97c459]">✓</span>}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] press"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 4: PRO registration ───────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Step 3 of 4 · PRO</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">Are you registered with a PRO?</h2>
                <p className="mt-3 text-sm leading-7 text-white/45">
                  PROs (Performing Rights Organizations) collect performance royalties every time your song is played publicly. This is separate from your distributor — and it&apos;s free.
                </p>
              </div>
              <div className="grid gap-2">
                {[
                  { id: "ASCAP", hint: "US-based, free, writers + publishers" },
                  { id: "BMI", hint: "US-based, free for songwriters" },
                  { id: "SESAC", hint: "Invite-only, US-based" },
                  { id: "SOCAN", hint: "Canada" },
                  { id: "PRS", hint: "UK" },
                  { id: "Other PRO", hint: "International or other" },
                  { id: "Not registered yet", hint: "Biggest quick win — ~10 min to register" },
                ].map(({ id, hint }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPro(id)}
                    className={`flex items-center justify-between rounded-xl border-[0.5px] px-4 py-4 text-left text-sm transition press ${
                      pro === id
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    <div>
                      <div className={pro === id ? "font-medium" : ""}>{id}</div>
                      <div className="mt-0.5 text-[11px] opacity-50">{hint}</div>
                    </div>
                    {pro === id && <span className="text-[#97c459]">✓</span>}
                  </button>
                ))}
              </div>
              {pro === "Not registered yet" && (
                <div className="rounded-xl border-[0.5px] border-[#ef9f27]/40 bg-[#faeeda]/10 px-4 py-4 text-sm text-[#ef9f27]">
                  <strong>Registration takes ~10 min</strong> and retroactively covers past plays. ASCAP and BMI are both free for songwriters.{" "}
                  <a
                    href="https://www.ascap.com/help/career-development/songwriter-composer-publisher-guide"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    Start with ASCAP →
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={next}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] press"
              >
                {pro ? "Continue" : "Skip for now"}
              </button>
            </div>
          )}

          {/* ── Step 5: Gap reveal ─────────────────────────────────── */}
          {step === 5 && (
            <div className="flex flex-col gap-8">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Step 4 of 4 · The Gap</div>
                <p className="mt-3 text-sm text-white/45">Estimated uncollected royalties across your catalog.</p>
              </div>

              <div
                className="relative overflow-hidden rounded-[24px] border-[0.5px] border-white/10 bg-[rgba(255,255,255,0.04)] p-6"
                style={{ animation: "onbFadeIn 0.4s ease-out both" }}
                onAnimationEnd={() => setGapRevealed(true)}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(239,159,39,0.12) 0%, transparent 70%)" }} />
                <div className="relative">
                  {songs.length === 0 ? (
                    <div style={{ animation: "onbFadeIn 0.4s 0.2s ease-out both" }}>
                      <div className="text-[48px] font-light text-white/20">—</div>
                      <p className="mt-3 text-sm leading-6 text-white/45">
                        No releases added yet. Go back and add a song to see your gap.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-[64px] font-light leading-none tracking-[-0.05em] text-[#ef9f27]" style={{ animation: "onbFadeIn 0.3s 0.15s ease-out both" }}>
                        {gapRevealed ? <GapCountUp target={summary.totalEstimatedGap} /> : "$0"}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-white/45" style={{ animation: "onbFadeIn 0.3s 0.5s ease-out both" }}>
                        Estimated uncollected · {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"} · {summary.activeIncomeStreams} streams active
                      </p>
                    </>
                  )}
                  <div className="mt-5 rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4" style={{ animation: "onbFadeIn 0.3s 0.7s ease-out both" }}>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">Biggest fix</div>
                    <div className="mt-2 text-sm text-white">{nextAction.action} via {nextAction.collectionBody}</div>
                    <div className="mt-1 text-xs text-white/40">{formatGapEstimate(nextAction.estimatedValue)} · {nextAction.estimatedTime}</div>
                  </div>
                  <p className="mt-4 text-[11px] text-white/20">Conservative estimate. Not guaranteed income. For illustration purposes.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  completeOnboarding({ artistName: artistName.trim() || profile.artistName || "Artist", role: role.trim() || profile.role || "", vibe: "", currentProject: "", targetWindow: "", mainGoal: "" });
                  if (signedIn) { router.push("/home"); } else { next(); }
                }}
                className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] press"
              >
                {signedIn ? "Enter the app →" : "Start collecting →"}
              </button>
            </div>
          )}

          {/* ── Step 6: Sign up / Trial CTA ────────────────────────── */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">You&apos;re ready</div>
                <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em]">
                  Create your account to save everything.
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/45">
                  Your profile, songs, and Gap data are currently saved to this device. Sign up to access them anywhere and unlock the full action queue.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border-[0.5px] border-white/10">
                {[
                  { icon: "✓", text: "Exact dollar estimates per stream type" },
                  { icon: "✓", text: "Full action queue with step-by-step guides" },
                  { icon: "✓", text: "Release Radar with milestone tracking" },
                  { icon: "✓", text: "Statement import and royalty analysis" },
                  { icon: "✓", text: "Split sheet generation and signing" },
                ].map(({ icon, text }, i) => (
                  <div key={text} className={`flex items-center gap-3 px-4 py-3.5 text-sm ${i < 4 ? "border-b border-white/[0.06]" : ""}`}>
                    <span className="text-[#97c459]">{icon}</span>
                    <span className="text-white/70">{text}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/sign-in?mode=sign-up")}
                  className="h-14 w-full rounded-2xl bg-white text-base font-medium text-[#0d0d0b] press"
                >
                  Create free account →
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/home")}
                  className="h-14 w-full rounded-2xl border-[0.5px] border-white/15 text-base text-white/60 press"
                >
                  Continue without account
                </button>
              </div>

              <p className="text-center text-[11px] text-white/25">
                Free tier · No card required · Upgrade anytime
              </p>
            </div>
          )}

      </main>
    </div>
  );
}
