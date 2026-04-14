"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePocket } from "@/components/pocket-provider";

type PocketItem = {
  id: string;
  type: "Voice memo" | "File" | "Note" | "Task" | "Link" | "Photo";
  body: string;
  songId: string;
  createdAt: string;
};

const CAPTURE_STORAGE_KEY = "pocket-manager-captures";

const captureTypes = [
  { label: "Note" as const, icon: "✎" },
  { label: "Task" as const, icon: "⊕" },
  { label: "Link" as const, icon: "⊞" },
  { label: "Voice memo" as const, icon: "♪" },
  { label: "File" as const, icon: "◻" },
  { label: "Photo" as const, icon: "◈" },
] as const;

function loadItems(): PocketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CAPTURE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PocketItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items: PocketItem[]) {
  try {
    window.localStorage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(items));
  } catch { /* noop */ }
}

// ─── Voice recorder ─────────────────────────────────────────────────────────
function VoiceRecorder({ onRecord }: { onRecord: (description: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startRecording() {
    setRecording(true);
    setDone(false);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setDone(true);
    onRecord(`Voice memo · ${seconds}s`);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const bars = Array.from({ length: 16 });

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Waveform */}
      <div className="flex h-10 items-end gap-[3px]">
        {bars.map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full bg-white/40"
            animate={recording ? {
              height: [6, 20 + Math.random() * 20, 8, 30 + Math.random() * 10, 6],
            } : { height: 6 }}
            transition={recording ? {
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.04,
              ease: "easeInOut",
            } : { duration: 0.2 }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-[22px] font-light tabular-nums text-white/70">
        {done
          ? `${seconds}s recorded`
          : recording
            ? `${seconds}s`
            : "Ready to record"}
      </div>

      {/* Hold button */}
      {!done && (
        <button
          type="button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`grid size-16 select-none place-items-center rounded-full text-2xl transition-all ${
            recording
              ? "scale-110 bg-[#e24b4a] ring-4 ring-[#e24b4a]/30"
              : "bg-white/15 hover:bg-white/25"
          }`}
          aria-label={recording ? "Release to stop" : "Hold to record"}
        >
          {recording ? "■" : "●"}
        </button>
      )}

      {!done && (
        <div className="text-[11px] text-white/30">
          {recording ? "Release to stop" : "Hold to record"}
        </div>
      )}

      {done && (
        <button
          type="button"
          onClick={() => { setDone(false); setSeconds(0); }}
          className="text-xs text-white/30 underline"
        >
          Record again
        </button>
      )}
    </div>
  );
}

export function PocketSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { songs } = usePocket();
  const [type, setType] = useState<PocketItem["type"]>("Note");
  const [songId, setSongId] = useState(songs[0]?.id ?? "inbox");
  const [body, setBody] = useState("");
  const [items, setItems] = useState<PocketItem[]>([]);
  const [saved, setSaved] = useState(false);

  // Load from storage when sheet opens
  useEffect(() => {
    if (open) {
      setItems(loadItems());
      setSaved(false);
      setBody("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function pocket() {
    const clean = body.trim();
    if (!clean) return;
    const next: PocketItem[] = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        body: clean,
        songId,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ].slice(0, 40);
    setItems(next);
    saveItems(next);
    setBody("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  const recent = items.slice(0, 3);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Sheet — frosted glass per V7 spec */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[24px] backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)] bg-[rgba(20,20,18,0.92)] text-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y > 60) onClose(); }}
          >
            {/* Handle — 36×4px per spec */}
            <div className="flex justify-center pt-[10px] pb-1">
              <div className="h-1 w-9 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div>
                <div className="text-[15px] font-medium">Pocket</div>
                <div className="text-xs text-white/35">Fast capture · route it later</div>
              </div>
              <button type="button" onClick={onClose} className="text-2xl font-light text-white/30" aria-label="Close Pocket">
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
              <div className="grid gap-4 p-5">
                {/* Type picker */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {captureTypes.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setType(item.label)}
                      className={`rounded-xl border-[0.5px] px-2 py-3 text-center text-sm ${
                        type === item.label
                          ? "border-[#534ab7] bg-[#eeedfe] text-[#534ab7]"
                          : "border-white/10 bg-[#1e1e1b] text-white/65"
                      }`}
                    >
                      <span className="block text-lg leading-none">{item.icon}</span>
                      <span className="mt-1.5 block text-[10px]">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Input area — voice recorder or textarea */}
                {type === "Voice memo" ? (
                  <div className="rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4">
                    <VoiceRecorder onRecord={(desc) => setBody(desc)} />
                  </div>
                ) : (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                      type === "Link"
                        ? "Paste link or reference"
                        : type === "File"
                        ? "Describe the file you need to attach"
                        : "Type a note or idea..."
                    }
                    className="min-h-24 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
                  />
                )}

                {/* Route chips */}
                <div>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Route to</div>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: "inbox", title: "Inbox" }, ...songs.slice(0, 4), { id: "vault", title: "The Vault" }].map((dest) => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setSongId(dest.id)}
                        className={`rounded-full border-[0.5px] px-3 py-2 text-xs ${
                          songId === dest.id
                            ? "border-[#534ab7] bg-[#534ab7] text-white"
                            : "border-white/10 bg-[#1e1e1b] text-white/60"
                        }`}
                      >
                        {dest.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={pocket}
                  disabled={!body.trim()}
                  className="h-[52px] rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#0d0d0b] disabled:opacity-40"
                >
                  {saved ? "Pocketed ✓" : "Pocket it"}
                </button>
              </div>

              {/* Recently pocketed */}
              {recent.length > 0 && (
                <div className="border-t border-white/10 px-5 py-4">
                  <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Recently pocketed</div>
                  <div className="space-y-2">
                    {recent.map((item) => {
                      const song = songs.find((s) => s.id === item.songId);
                      return (
                        <div key={item.id} className="flex items-start gap-3 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-3 py-2.5">
                          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{item.type}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-white/70">{item.body}</span>
                          <span className="shrink-0 text-[10px] text-white/30">{song?.title ?? "Inbox"}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/vault" onClick={onClose} className="mt-3 inline-flex text-xs text-white/35">
                    View all in Vault →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
