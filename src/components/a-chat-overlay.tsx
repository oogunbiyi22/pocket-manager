"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  getNextRevenueAction,
  getRevenueGapSummary,
} from "@/lib/backstage-data";

const QUICK_PROMPTS = [
  "What is my biggest gap?",
  "Walk me through it",
  "What should I fix next?",
  "Show my readiness score",
];

export function AChatOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { songs, profile } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/v1/manager/chat",
      body: { artistName: profile.artistName ?? "Artist" },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  const greeting = `Your biggest gap right now is ${nextAction.collectionBody}. That's ${formatGapEstimate(nextAction.estimatedValue)} sitting uncollected on "${nextAction.songTitle}". Takes ${nextAction.estimatedTime}. Want me to walk you through it?`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
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

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    sendMessage({ text: clean });
    setDraft("");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Chat sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[24px] bg-[rgba(20,20,18,0.96)] backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)] text-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
          >
            {/* Drag handle */}
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-9 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0d0d0b] px-5 py-4">
              <div>
                <div className="text-[15px] font-medium text-white">A</div>
                <div className="mt-0.5 text-xs text-white/35">Your manager · Always on</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-white/30">
                  {formatGapEstimate(summary.totalEstimatedGap)} gap · {songs.length} songs
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid size-8 place-items-center rounded-full border border-white/10 text-lg font-light text-white/40"
                  aria-label="Close A"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-5">
              {/* Greeting */}
              {!hasMessages && (
                <>
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
                  <div className="max-w-[88%] rounded-xl rounded-bl-sm border border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white/80">
                    {greeting}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => submit(p)}
                        className="rounded-full border border-white/10 bg-[#1e1e1b] px-3 py-2 text-xs text-white/65 transition active:scale-95"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Real messages */}
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const textPart = msg.parts?.find((p) => p.type === "text");
                const text = textPart ? (textPart as { type: "text"; text: string }).text : "";
                if (!text) return null;
                return (
                  <div key={msg.id} className={`mt-4 flex ${isUser ? "justify-end" : "flex-col"}`}>
                    {!isUser && (
                      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
                    )}
                    <div
                      className={
                        isUser
                          ? "max-w-[82%] rounded-xl rounded-br-sm bg-white px-4 py-3 text-sm leading-6 text-[#0d0d0b]"
                          : "max-w-[88%] rounded-xl rounded-bl-sm border border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white/80"
                      }
                    >
                      {text}
                    </div>
                  </div>
                );
              })}

              {/* Streaming indicator */}
              {isStreaming && (
                <div className="mt-4 flex flex-col">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
                  <div className="flex gap-1 rounded-xl rounded-bl-sm border border-white/10 bg-[#1e1e1b] px-4 py-3">
                    <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-[#0d0d0b] px-4 py-3"
              onSubmit={(e) => { e.preventDefault(); submit(draft); }}
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask A anything about your catalog..."
                disabled={isStreaming}
                className="h-10 flex-1 rounded-full border border-white/10 bg-[#1e1e1b] px-4 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isStreaming || !draft.trim()}
                className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#1e1e1b] text-sm text-white/70 disabled:opacity-40 transition active:scale-95"
                aria-label="Send"
              >
                →
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
