"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPlatform, type PlatformEntry } from "@/lib/platform-registry";
import { buildFixId, startFix, completeFix, skipFix, getFixRecord, type FixRecord } from "@/lib/fix-flows";

type ActionModalProps = {
  /** Pass a platformId to auto-load from registry, or pass a custom `platform` object */
  platformId?: string;
  platform?: Partial<PlatformEntry>;
  /** If this fix is scoped to a specific song */
  songId?: string;
  songTitle?: string;
  /** Dollar value at stake */
  estimatedValue?: number;
  streamType?: string;
  open: boolean;
  onClose: () => void;
  /** Called when user confirms completion */
  onComplete?: () => void;
};

type Phase = "guide" | "started" | "confirm" | "done";

function stateToPhase(state: FixRecord["state"] | undefined): Phase {
  if (state === "in_progress") return "started";
  if (state === "completed") return "done";
  return "guide";
}

export function ActionModal({
  platformId,
  platform: customPlatform,
  songId,
  songTitle,
  estimatedValue = 0,
  streamType,
  open,
  onClose,
  onComplete,
}: ActionModalProps) {
  const p: Partial<PlatformEntry> = platformId
    ? (getPlatform(platformId) ?? customPlatform ?? {})
    : (customPlatform ?? {});

  const fixId = buildFixId(platformId ?? p.id ?? p.name ?? "unknown", songId);

  const [phase, setPhase] = useState<Phase>("guide");
  const [record, setRecord] = useState<FixRecord | null>(null);

  // Sync phase with stored state on open
  useEffect(() => {
    if (!open) return;
    const existing = getFixRecord(fixId);
    setRecord(existing);
    setPhase(stateToPhase(existing?.state));
  }, [open, fixId]);

  function handleOpenExternal() {
    if (p.connectUrl) {
      window.open(p.connectUrl, "_blank", "noopener,noreferrer");
    }
    // Record that fix has started
    const rec = startFix({
      fixId,
      estimatedValue,
      platform: p.name ?? platformId ?? "Unknown",
      songId,
      songTitle,
      streamType,
    });
    setRecord(rec);
    setPhase("started");
  }

  function handleConfirm() {
    setPhase("confirm");
  }

  function handleDone() {
    const rec = completeFix(fixId);
    setRecord(rec);
    setPhase("done");
    onComplete?.();
    setTimeout(() => {
      onClose();
      setPhase("guide");
    }, 1600);
  }

  function handleSkip() {
    skipFix(fixId);
    onClose();
    setPhase("guide");
  }

  function handleClose() {
    onClose();
    // Don't reset phase — let it persist so user can pick up where they left off
  }

  if (!open) return null;

  const alreadyCompleted = record?.state === "completed";
  const wasStarted = record?.state === "in_progress";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg"
          >
            <div className="m-3 overflow-hidden rounded-[28px] bg-[#0d0d0b] text-white">

              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-6 pt-6">
                <div>
                  {p.icon && <div className="mb-2 text-2xl">{p.icon}</div>}
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
                      {p.group ?? "Setup"}
                    </div>
                    {/* Status badge */}
                    {alreadyCompleted && (
                      <span className="rounded-full bg-[#97c459]/20 px-2 py-0.5 text-[10px] font-medium text-[#97c459]">✓ Done</span>
                    )}
                    {wasStarted && !alreadyCompleted && (
                      <span className="rounded-full bg-[#ef9f27]/20 px-2 py-0.5 text-[10px] font-medium text-[#ef9f27]">In progress</span>
                    )}
                  </div>
                  <h2 className="mt-1 text-xl font-light tracking-tight">{p.name ?? "Set up"}</h2>
                  {songTitle && (
                    <div className="mt-0.5 text-[12px] text-white/35">{songTitle}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-1 shrink-0 text-white/35 hover:text-white/70 transition text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6">
                {/* Why it matters + value at stake */}
                {p.whyItMatters && (
                  <p className="mt-4 text-sm leading-7 text-white/55">{p.whyItMatters}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {estimatedValue > 0 && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ef9f27]/15 px-3 py-1.5 text-[11px] text-[#ef9f27]">
                      <span>💰</span>
                      <span>~${estimatedValue.toFixed(0)} estimated uncollected</span>
                    </div>
                  )}
                  {p.estimatedMinutes && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] text-white/45">
                      <span>⏱</span>
                      <span>About {p.estimatedMinutes} min</span>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {/* STATE 1: Guide — show steps + CTA */}
                  {phase === "guide" && (
                    <motion.div
                      key="guide"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {p.steps && p.steps.length > 0 && (
                        <div className="mt-5 space-y-3">
                          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Steps</div>
                          {p.steps.map((step, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/50">
                                {i + 1}
                              </div>
                              <p className="text-sm leading-6 text-white/65">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {p.requires && p.requires.length > 0 && (
                        <div className="mt-5">
                          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">You&apos;ll need</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {p.requires.map((req) => (
                              <span key={req} className="rounded-full bg-white/[0.07] px-3 py-1 text-[12px] text-white/55">
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleOpenExternal}
                        className="mt-6 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]"
                      >
                        Open {p.name ?? "platform"} to start →
                      </button>

                      {p.searchUnclaimedUrl && (
                        <a
                          href={p.searchUnclaimedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center text-[13px] text-white/35 hover:text-white/60 transition"
                        >
                          Search for unclaimed money in my name →
                        </a>
                      )}
                    </motion.div>
                  )}

                  {/* STATE 2: Started — user opened external site */}
                  {phase === "started" && (
                    <motion.div
                      key="started"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6"
                    >
                      <div className="rounded-2xl border border-[#ef9f27]/30 bg-[#ef9f27]/10 p-4 text-center">
                        <div className="text-2xl">🕐</div>
                        <div className="mt-2 text-sm font-medium text-[#ef9f27]">In progress</div>
                        <p className="mt-2 text-xs leading-6 text-[#ef9f27]/70">
                          {p.confirmPrompt ?? "Complete the steps, then mark it done below."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirm}
                        className="mt-4 w-full rounded-2xl bg-[#97c459] py-4 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 active:scale-[0.98]"
                      >
                        I&apos;ve completed this ✓
                      </button>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleOpenExternal}
                          className="rounded-2xl border border-white/15 py-3 text-[13px] text-white/50 transition hover:border-white/30 hover:text-white/70"
                        >
                          Open again
                        </button>
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="rounded-2xl border border-white/15 py-3 text-[13px] text-white/35 transition hover:border-white/30 hover:text-white/55"
                        >
                          Skip for now
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STATE 3: Confirm — ask them to verify */}
                  {phase === "confirm" && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6"
                    >
                      <p className="text-sm leading-7 text-white/65">
                        Confirm that you completed the following on {p.name}:
                      </p>
                      <div className="mt-4 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4">
                        <p className="text-sm leading-6 text-white/75">
                          {p.confirmPrompt ?? "You completed all required steps on the platform."}
                        </p>
                      </div>
                      {estimatedValue > 0 && (
                        <div className="mt-4 text-center text-xs text-white/35">
                          Estimated revenue recovery: <span className="text-[#97c459]">~${estimatedValue.toFixed(0)}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleDone}
                        className="mt-5 w-full rounded-2xl bg-[#97c459] py-4 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 active:scale-[0.98]"
                      >
                        Yes, mark as complete ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhase("started")}
                        className="mt-3 w-full text-center text-[13px] text-white/35 hover:text-white/55 transition"
                      >
                        ← Not yet, go back
                      </button>
                    </motion.div>
                  )}

                  {/* STATE 4: Done */}
                  {phase === "done" && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-6 text-center"
                    >
                      <div className="text-4xl">✓</div>
                      <p className="mt-3 text-sm font-medium text-[#97c459]">Complete</p>
                      {estimatedValue > 0 && (
                        <p className="mt-2 text-xs text-white/40">
                          ~${estimatedValue.toFixed(0)} on its way to being collected.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
