"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  getNextRevenueAction,
  getRevenueActionQueue,
  getRevenueGapSummary,
} from "@/lib/backstage-data";
import { getFixSummary, getStaleFixes, getAllFixRecords } from "@/lib/fix-flows";

const TRIAGE_KEY = "pocket-a-triage-dismissed";
const CHAT_HISTORY_KEY = "pocket-a-chat-history";
const MAX_SAVED_MESSAGES = 40;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

type SavedMessage = { id: string; role: "user" | "assistant"; text: string; savedAt: string };

function loadChatHistory(): SavedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SavedMessage[]) : [];
  } catch { return []; }
}

function saveChatHistory(msgs: SavedMessage[]) {
  try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_SAVED_MESSAGES))); } catch { /* noop */ }
}

export default function APage() {
  const { songs, profile, platformConnections } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
  const actionQueue = getRevenueActionQueue(songs).slice(0, 5);
  const fixSummary = getFixSummary();
  const staleFixes = getStaleFixes();
  const allFixRecords = getAllFixRecords();

  const [draft, setDraft] = useState("");
  const [triageDismissedDay, setTriageDismissedDay] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(TRIAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [triageManuallyOpen, setTriageManuallyOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<SavedMessage[]>(() => loadChatHistory());
  const [historyVisible, setHistoryVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const triageVisible = songs.length > 0
    && summary.totalEstimatedGap > 0
    && (triageManuallyOpen || triageDismissedDay !== getTodayKey());

  function dismissTriage() {
    const todayKey = getTodayKey();
    try { localStorage.setItem(TRIAGE_KEY, todayKey); } catch { /* noop */ }
    setTriageDismissedDay(todayKey);
    setTriageManuallyOpen(false);
  }

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/v1/manager/chat",
      body: {
        artistName: profile.artistName ?? "Artist",
        songs,
        platforms: platformConnections,
        fixProgress: { summary: fixSummary, stale: staleFixes.length },
      },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  // Persist new messages to localStorage as they arrive
  useEffect(() => {
    if (messages.length === 0) return;
    const toSave: SavedMessage[] = messages.flatMap((msg) => {
      const textPart = msg.parts?.find((p) => p.type === "text");
      const text = textPart ? (textPart as { type: "text"; text: string }).text : "";
      if (!text) return [];
      return [{ id: msg.id, role: msg.role as "user" | "assistant", text, savedAt: new Date().toISOString() }];
    });
    saveChatHistory(toSave);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    sendMessage({ text: clean });
    setDraft("");
    setTriageManuallyOpen(false); // hide triage once conversation starts
  }

  // Context-aware greeting based on actual state
  function buildGreeting() {
    if (songs.length === 0) {
      return "I need your catalog before I can run the numbers. Add your first release and I'll scan every revenue path — gaps, missing registrations, and your next moves. Want me to walk you through it?";
    }
    if (staleFixes.length > 0) {
      const s = staleFixes[0];
      return `You started a fix on ${s.platform} over 48 hours ago and haven't confirmed it. That's ~$${s.estimatedValue.toFixed(0)} still in limbo. Let's finish that now.`;
    }
    if (fixSummary.completed > 0) {
      return `You've closed ${fixSummary.completed} fix${fixSummary.completed === 1 ? "" : "es"} — that's ~$${fixSummary.totalRecovered.toFixed(0)} on its way. ${fixSummary.inProgress > 0 ? `${fixSummary.inProgress} still in progress. Want to pick up where you left off?` : nextAction.estimatedValue > 0 ? `Next up: ${nextAction.action} via ${nextAction.collectionBody} — about ${formatGapEstimate(nextAction.estimatedValue)}.` : "Nothing left in the queue."}`;
    }
    if (summary.totalEstimatedGap > 0) {
      return `Here's your situation: ${nextAction.action} via ${nextAction.collectionBody}${nextAction.songTitle ? ` for "${nextAction.songTitle}"` : ""} — ${formatGapEstimate(nextAction.estimatedValue)} uncollected. Takes ${nextAction.estimatedTime}. Want me to walk you through it?`;
    }
    return `No open gaps right now. ${songs.length} track${songs.length === 1 ? "" : "s"} tracked. Your vault is the next thing to look at — make sure masters, splits, and artwork are all filed. Ask me anything.`;
  }

  // Context-aware quick prompts — always lead with the two signature actions
  function buildQuickPrompts() {
    if (songs.length === 0) {
      return ["How do I add my first release?", "What is an ISRC?", "What's the biggest mistake artists make with royalties?"];
    }
    const prompts: string[] = ["What am I missing?", "What should I do next?"];
    if (staleFixes.length > 0) prompts.push(`Remind me what I started on ${staleFixes[0].platform}`);
    else if (nextAction.estimatedValue > 0) prompts.push(`Walk me through ${nextAction.collectionBody}`);
    if (summary.totalEstimatedGap > 0) prompts.push("What is my biggest gap?");
    return prompts.slice(0, 4);
  }

  const quickPrompts = buildQuickPrompts();
  const greeting = buildGreeting();

  return (
    <AppShell title="A" eyebrow="Manager">
      <main className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_0.85fr]">

        {/* ── Chat panel ─────────────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">
          <header className="flex items-center justify-between border-b-[0.5px] border-white/10 bg-[#0d0d0b] px-5 py-4">
            <div>
              <div className="text-[15px] font-medium text-white">A</div>
              <div className="mt-0.5 text-xs text-white/35">
                {isStreaming ? "Thinking…" : "Your manager · Always on"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {songs.length > 0 && summary.totalEstimatedGap > 0 && !triageVisible && (
                <button
                  type="button"
                  onClick={() => setTriageManuallyOpen(true)}
                  className="rounded-full border-[0.5px] border-[#ef9f27]/40 bg-[#ef9f27]/10 px-3 py-1.5 text-[10px] font-medium text-[#ef9f27] transition hover:bg-[#ef9f27]/20"
                >
                  Triage
                </button>
              )}
              {chatHistory.length > 0 && !hasMessages && (
                <button
                  type="button"
                  onClick={() => setHistoryVisible((v) => !v)}
                  className="rounded-full border-[0.5px] border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] text-white/40 transition hover:text-white/60"
                >
                  {historyVisible ? "Hide history" : `History (${chatHistory.length})`}
                </button>
              )}
              {chatHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => { saveChatHistory([]); setChatHistory([]); setHistoryVisible(false); }}
                  className="text-[10px] text-white/20 transition hover:text-white/40"
                >
                  Clear
                </button>
              )}
              <Link href="/mobile" className="ml-1 text-2xl font-light text-white/35" aria-label="Close A">
                ×
              </Link>
            </div>
          </header>

          <div className="flex max-h-[560px] min-h-[460px] flex-col overflow-y-auto px-5 py-5">

            {/* ── Saved chat history ──────────────────────────────────────── */}
            {historyVisible && !hasMessages && chatHistory.length > 0 && (
              <div className="mb-4 space-y-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">Previous session</div>
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "flex-col"}`}>
                    {msg.role === "assistant" && (
                      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">A</div>
                    )}
                    <div className={`max-w-[88%] rounded-xl px-4 py-2.5 text-xs leading-5 opacity-50 ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-white/10 text-white"
                        : "rounded-bl-sm border-[0.5px] border-white/8 bg-[#1e1e1b] text-white/70"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div className="text-[10px] text-white/15">— new session below —</div>
              </div>
            )}

            {/* ── Triage mode panel ───────────────────────────────────────── */}
            {triageVisible && !hasMessages && (
              <div className="mb-5 overflow-hidden rounded-[18px] border-[0.5px] border-[#ef9f27]/30 bg-[#ef9f27]/10">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ef9f27]/70">Triage scan</div>
                    <div className="mt-0.5 text-sm font-medium text-[#ef9f27]">
                      {formatGapEstimate(summary.totalEstimatedGap)} uncollected across {summary.songsWithGaps} song{summary.songsWithGaps === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button type="button" onClick={dismissTriage} className="text-[#ef9f27]/40 hover:text-[#ef9f27]/70 transition text-xl">×</button>
                </div>
                <div className="border-t border-[#ef9f27]/20 px-4 py-3 space-y-2">
                  {actionQueue.slice(0, 3).map((action, i) => {
                    const fixRecord = allFixRecords.find((r) => r.fixId.includes(action.collectionBody.toLowerCase().replace(/\s+/g, "_")));
                    const isDone = fixRecord?.state === "completed";
                    const isInProgress = fixRecord?.state === "in_progress";
                    return (
                      <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isDone ? "bg-[#97c459]/10" : "bg-white/[0.05]"}`}>
                        <div className={`size-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? "bg-[#97c459] text-[#0d0d0b]" : isInProgress ? "bg-[#ef9f27] text-[#0d0d0b]" : "bg-white/10 text-white/40"}`}>
                          {isDone ? "✓" : isInProgress ? "→" : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-white/80 truncate">{action.action} · {action.collectionBody}</div>
                          <div className="text-[10px] text-[#ef9f27]/70">{formatGapEstimate(action.estimatedValue)} · {action.estimatedTime}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => submit(`Walk me through ${action.action} via ${action.collectionBody}${action.songTitle ? ` for "${action.songTitle}"` : ""}`)}
                          className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] text-white/60 transition hover:bg-white/20"
                        >
                          Go →
                        </button>
                      </div>
                    );
                  })}
                </div>
                {fixSummary.completed > 0 && (
                  <div className="border-t border-[#ef9f27]/20 px-4 py-2.5 text-[11px] text-[#ef9f27]/50">
                    {fixSummary.completed} fix{fixSummary.completed === 1 ? "" : "es"} completed · ~${fixSummary.totalRecovered.toFixed(0)} recovered
                  </div>
                )}
              </div>
            )}

            {/* ── Stale fix nudge ─────────────────────────────────────────── */}
            {staleFixes.length > 0 && !triageVisible && !hasMessages && (
              <div className="mb-4 rounded-[16px] border-[0.5px] border-[#ef9f27]/30 bg-[#ef9f27]/8 px-4 py-3">
                <div className="text-[11px] font-medium text-[#ef9f27]">
                  ⏰ You started fixing {staleFixes[0].platform} more than 48h ago
                </div>
                <button
                  type="button"
                  onClick={() => submit(`Remind me what I was doing with ${staleFixes[0].platform}. I started a fix but didn't finish it.`)}
                  className="mt-2 text-[11px] text-[#ef9f27]/60 underline underline-offset-2 hover:text-[#ef9f27] transition"
                >
                  Pick up where I left off →
                </button>
              </div>
            )}

            {/* Greeting */}
            {!hasMessages && (
              <>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
                <div className="max-w-[88%] rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-7 text-white/80">
                  {greeting}
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
                  <div className={isUser
                    ? "max-w-[82%] rounded-xl rounded-br-sm bg-white px-4 py-3 text-sm leading-6 text-[#0d0d0b]"
                    : "max-w-[88%] rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-7 text-white/80"
                  }>
                    {text}
                  </div>
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="mt-4 flex flex-col">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
                <div className="flex gap-1 rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Quick prompts */}
            {!hasMessages && !isStreaming && (
              <div className="mt-5 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submit(prompt)}
                    className="rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] px-3 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white/85"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t-[0.5px] border-white/10 bg-[#0d0d0b] px-4 py-3"
            onSubmit={(e) => { e.preventDefault(); submit(draft); }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={songs.length === 0 ? "Ask me anything to get started…" : "Ask A anything about your catalog…"}
              disabled={isStreaming}
              className="h-10 flex-1 rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !draft.trim()}
              className="grid size-10 place-items-center rounded-full bg-white text-[#0d0d0b] text-sm font-semibold disabled:opacity-30 transition hover:bg-white/90"
            >
              →
            </button>
          </form>
        </section>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="space-y-4">

          {/* Account snapshot */}
          <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#0d0d0b] text-white p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Account</div>
            {songs.length === 0 ? (
              <div className="mt-4 text-center py-4">
                <div className="text-2xl">🎵</div>
                <p className="mt-3 text-sm text-white/45 leading-6">No releases yet. Add your first song to unlock your gap analysis.</p>
                <Link href="/projects/new" className="mt-4 block rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#0d0d0b] text-center transition hover:bg-white/90">
                  Add release →
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[22px] font-light text-white">{songs.length}</div>
                    <div className="text-[10px] text-white/30">tracks</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-light text-[#ef9f27]">{formatGapEstimate(summary.totalEstimatedGap)}</div>
                    <div className="text-[10px] text-white/30">gap</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-light text-[#97c459]">{fixSummary.completed}</div>
                    <div className="text-[10px] text-white/30">fixed</div>
                  </div>
                </div>
                {fixSummary.totalRecovered > 0 && (
                  <div className="mt-4 rounded-xl bg-[#97c459]/15 px-4 py-3 text-center">
                    <div className="text-sm font-medium text-[#97c459]">~${fixSummary.totalRecovered.toFixed(0)} recovered so far</div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Action queue */}
          {songs.length > 0 && actionQueue.length > 0 && (
            <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Priority queue</div>
              <div className="mt-4 space-y-2">
                {actionQueue.map((action, i) => {
                  const fixRecord = allFixRecords.find((r) => r.fixId.includes(action.collectionBody.toLowerCase().replace(/\s+/g, "_")));
                  const isDone = fixRecord?.state === "completed";
                  const isInProgress = fixRecord?.state === "in_progress";
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => submit(`Walk me through: ${action.action} via ${action.collectionBody}${action.songTitle ? ` for "${action.songTitle}"` : ""}`)}
                      className={`w-full rounded-[14px] px-4 py-3 text-left transition hover:opacity-80 ${
                        isDone ? "bg-[#eaf3de]" : isInProgress ? "bg-[#faeeda]" : "bg-[#f5f4f0]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${isDone ? "text-[#3b6d11]" : isInProgress ? "text-[#854f0b]" : "text-[#9a9a8a]"}`}>
                          {isDone ? "✓ Done" : isInProgress ? "In progress" : `#${i + 1}`}
                        </span>
                        <span className="text-[12px] font-medium text-[#111] truncate">{action.collectionBody}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#9a9a8a]">{formatGapEstimate(action.estimatedValue)} · {action.estimatedTime}</div>
                    </button>
                  );
                })}
              </div>
              <Link href="/actions" className="mt-4 block text-center text-[11px] text-[#9a9a8a] hover:text-[#111] transition">
                See full queue →
              </Link>
            </section>
          )}

          {/* Progress memory */}
          {(fixSummary.inProgress > 0 || fixSummary.completed > 0) && (
            <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Progress memory</div>
              <p className="mt-3 text-sm leading-6 text-[#514d47]">
                A remembers every fix you&apos;ve started or completed this session.
                {fixSummary.stale > 0 && (
                  <span className="text-[#ef9f27]"> {fixSummary.stale} fix{fixSummary.stale === 1 ? "" : "es"} have been in progress for 48h+ without confirmation.</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => submit("Show me all the fixes I've started and where they stand")}
                className="mt-3 text-[12px] text-[#9a9a8a] underline underline-offset-2 hover:text-[#111] transition"
              >
                Review my progress →
              </button>
            </section>
          )}
        </aside>
      </main>
    </AppShell>
  );
}
