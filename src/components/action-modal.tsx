"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPlatform, type PlatformEntry } from "@/lib/platform-registry";

type ActionModalProps = {
  /** Pass a platformId to auto-load from registry, or pass a custom `platform` object */
  platformId?: string;
  platform?: Partial<PlatformEntry>;
  open: boolean;
  onClose: () => void;
  /** Called when user clicks "I've completed this" */
  onComplete?: () => void;
};

type Phase = "guide" | "waiting" | "done";

export function ActionModal({ platformId, platform: customPlatform, open, onClose, onComplete }: ActionModalProps) {
  const [phase, setPhase] = useState<Phase>("guide");

  const p: Partial<PlatformEntry> = platformId
    ? (getPlatform(platformId) ?? customPlatform ?? {})
    : (customPlatform ?? {});

  function handleOpen() {
    if (p.connectUrl) {
      window.open(p.connectUrl, "_blank", "noopener,noreferrer");
    }
    setPhase("waiting");
  }

  function handleDone() {
    setPhase("done");
    onComplete?.();
    setTimeout(() => {
      onClose();
      setPhase("guide");
    }, 1400);
  }

  function handleClose() {
    onClose();
    setPhase("guide");
  }

  if (!open) return null;

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
                  {p.icon && (
                    <div className="mb-2 text-2xl">{p.icon}</div>
                  )}
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
                    {p.group ?? "Setup"}
                  </div>
                  <h2 className="mt-1 text-xl font-light tracking-tight">{p.name ?? "Set up"}</h2>
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
                {/* Why it matters */}
                {p.whyItMatters && (
                  <p className="mt-4 text-sm leading-7 text-white/55">{p.whyItMatters}</p>
                )}

                {/* Time estimate */}
                {p.estimatedMinutes && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[11px] text-white/45">
                    <span>⏱</span>
                    <span>About {p.estimatedMinutes} min</span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {phase === "guide" && (
                    <motion.div
                      key="guide"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Steps */}
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

                      {/* What you need */}
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

                      {/* CTA */}
                      <button
                        type="button"
                        onClick={handleOpen}
                        className="mt-6 w-full rounded-2xl bg-white py-4 text-sm font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]"
                      >
                        Open {p.name ?? "platform"} →
                      </button>

                      {/* Search unclaimed */}
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

                  {phase === "waiting" && (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-6 text-center"
                    >
                      <div className="text-3xl">⏳</div>
                      <p className="mt-3 text-sm leading-7 text-white/55">
                        {p.confirmPrompt
                          ? `When you're done: "${p.confirmPrompt}"`
                          : "Complete the steps on the external site, then come back here."}
                      </p>
                      <button
                        type="button"
                        onClick={handleDone}
                        className="mt-6 w-full rounded-2xl bg-[#97c459] py-4 text-sm font-semibold text-[#0d0d0b] transition hover:opacity-90 active:scale-[0.98]"
                      >
                        I&apos;ve completed this ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhase("guide")}
                        className="mt-3 w-full text-center text-[13px] text-white/35 hover:text-white/60 transition"
                      >
                        ← Back to steps
                      </button>
                    </motion.div>
                  )}

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
                      <p className="mt-3 text-sm text-white/55">Marked as complete. Nice work.</p>
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
