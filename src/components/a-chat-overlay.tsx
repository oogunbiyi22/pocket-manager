"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { usePocket } from "@/components/pocket-provider";
import { getAuthHeaders } from "@/lib/supabase";
import {
  formatGapEstimate,
  getNextRevenueAction,
  getRevenueGapSummary,
  getCatalogReadinessScore,
  getReadinessLevel,
} from "@/lib/backstage-data";

const QUICK_PROMPTS = [
  "What is my biggest gap?",
  "Walk me through it",
  "What should I fix next?",
  "Show my readiness score",
];

const POSITION_KEY = "pocket-manager-a-position";

type Position = { x: number; y: number };

function loadPosition(): Position | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Position;
  } catch { return null; }
}

function savePosition(pos: Position) {
  try { localStorage.setItem(POSITION_KEY, JSON.stringify(pos)); } catch { /* noop */ }
}

// ─── Chat overlay sheet ─────────────────────────────────────────────────────
function ChatSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { songs, profile, platformConnections } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
  const catalogReadiness = getCatalogReadinessScore(songs);
  const readinessLevel = getReadinessLevel(catalogReadiness);
  const [draft, setDraft] = useState("");
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startY: number; currentY: number } | null>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/v1/manager/chat",
      // The server derives the plan from this session token — the body
      // no longer carries a client-claimed plan.
      headers: () => getAuthHeaders(),
      body: {
        artistName: profile.artistName ?? "Artist",
        managerName: profile.managerName ?? "REMY",
        page: "overlay",
        songs,
        platforms: platformConnections,
      },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  const greeting = `Your biggest gap right now is ${nextAction.collectionBody}. That's ${formatGapEstimate(nextAction.estimatedValue)} sitting uncollected on "${nextAction.songTitle}". Takes ${nextAction.estimatedTime}. Want me to walk you through it?`;

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      queueMicrotask(() => setMounted(false));
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    sendMessage({ text: clean });
    setDraft("");
  }

  // Touch drag-to-dismiss on the sheet
  function onTouchStart(e: React.TouchEvent) {
    dragRef.current = { startY: e.touches[0].clientY, currentY: e.touches[0].clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (dragRef.current) dragRef.current.currentY = e.touches[0].clientY;
  }
  function onTouchEnd() {
    if (dragRef.current && dragRef.current.currentY - dragRef.current.startY > 80) onClose();
    dragRef.current = null;
  }

  if (!open && !mounted) return null;

  return (
    <>
      <style>{`
        @keyframes acBdIn  { from{opacity:0} to{opacity:1} }
        @keyframes acBdOut { from{opacity:1} to{opacity:0} }
        @keyframes acSlIn  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes acSlOut { from{transform:translateY(0)} to{transform:translateY(100%)} }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        style={{ animation: `${mounted ? "acBdIn" : "acBdOut"} 0.2s ease both` }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[28px] bg-[rgba(13,13,11,0.97)] text-white"
        style={{ animation: `${mounted ? "acSlIn" : "acSlOut"} 0.28s cubic-bezier(0.16,1,0.3,1) both` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-9 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#97c459] animate-pulse" />
              <div className="text-[15px] font-medium text-white">A</div>
            </div>
            <div className="mt-0.5 text-xs text-white/35">Your manager · Always on</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-xs text-white/30 sm:block">
              {formatGapEstimate(summary.totalEstimatedGap)} gap · {catalogReadiness}% ready · {readinessLevel}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full border border-white/10 text-lg font-light text-white/40 transition hover:border-white/25 hover:text-white/70"
              aria-label="Close A"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 py-5">
          {!hasMessages && (
            <>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">A</div>
              <div className="max-w-[88%] rounded-[16px] rounded-bl-sm border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/80">
                {greeting}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => submit(p)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition press hover:border-white/20 hover:text-white/80">
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const textPart = msg.parts?.find((p) => p.type === "text");
            const text = textPart ? (textPart as { type: "text"; text: string }).text : "";
            if (!text) return null;
            return (
              <div key={msg.id} className={`mt-4 flex ${isUser ? "justify-end" : "flex-col"}`}>
                {!isUser && <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">A</div>}
                <div className={isUser
                  ? "max-w-[82%] rounded-[16px] rounded-br-sm bg-white px-4 py-3 text-sm leading-7 text-[#0d0d0b]"
                  : "max-w-[88%] rounded-[16px] rounded-bl-sm border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm leading-7 text-white/80"
                }>
                  {text}
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="mt-4 flex flex-col">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">A</div>
              <div className="flex gap-1.5 rounded-[16px] rounded-bl-sm border border-white/[0.08] bg-white/[0.06] px-4 py-3">
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
          className="flex shrink-0 items-center gap-2 border-t border-white/[0.08] bg-[rgba(13,13,11,0.98)] px-4 py-3 pb-safe"
          onSubmit={(e) => { e.preventDefault(); submit(draft); }}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask A anything about your catalog..."
            disabled={isStreaming}
            className="h-10 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 disabled:opacity-50"
          />
          <button type="submit" disabled={isStreaming || !draft.trim()}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-sm text-white/70 transition active:scale-90 disabled:opacity-40"
            aria-label="Send">
            →
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Chat overlay wrapper ───────────────────────────────────────────────────
export function AChatOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <ChatSheet open={open} onClose={onClose} />;
}

// ─── Draggable floating A button ────────────────────────────────────────────
export function DraggableAButton({ onOpen }: { onOpen: () => void }) {
  const { songs } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const hasGap = summary.totalEstimatedGap > 0;

  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragStart = useRef<{ x: number; y: number; btnX: number; btnY: number } | null>(null);

  useEffect(() => {
    const saved = loadPosition();
    queueMicrotask(() => {
      if (saved) setPosition(saved);
      setReady(true);
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, btnX: position.x, btnY: position.y };
    setIsDragging(false);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setIsDragging(true);
      setPosition({ x: dragStart.current.btnX + dx, y: dragStart.current.btnY + dy });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragStart.current) {
      savePosition(position);
      dragStart.current = null;
    }
  }, [position]);

  if (!ready) return null;

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => { if (!isDragging) onOpen(); }}
      className="fixed z-50 size-12 rounded-full glass-dark text-[15px] font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center"
      style={{
        bottom: 76 + position.y * -1,
        right: 16 + position.x * -1,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      aria-label="Open A — your AI manager"
    >
      A
      {hasGap && (
        <span className="absolute right-0 top-0 size-3 rounded-full bg-[var(--amber)] ring-2 ring-[var(--bg-base)]" />
      )}
    </button>
  );
}
