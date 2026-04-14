"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getNextRevenueAction, getRevenueGapSummary } from "@/lib/backstage-data";

const modelStrategy = [
  {
    label: "Default",
    title: "Cost-smart manager chat",
    detail: "Use a fast, low-cost model for daily catalog questions, next actions, and short guidance.",
  },
  {
    label: "Escalate",
    title: "Hard calls only",
    detail: "Use a stronger model for contracts, messy statements, high-stakes strategy, and long context.",
  },
  {
    label: "Fallback",
    title: "Never single-vendor",
    detail: "Keep provider switching available so A stays reliable if pricing, latency, or quality shifts.",
  },
];

const QUICK_PROMPTS = [
  "What is my biggest gap?",
  "Walk me through it",
  "Show the ISRC",
  "What should I fix next?",
];

export default function APage() {
  const { songs, profile, platformConnections } = usePocket();
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/v1/manager/chat",
      body: {
        artistName: profile.artistName ?? "Artist",
        songs,
        platforms: platformConnections,
      },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    sendMessage({ text: clean });
    setDraft("");
  }

  // Derive display messages: if no messages yet, show a context-aware greeting
  const hasMessages = messages.length > 0;
  const greeting = `Your biggest gap right now is ${nextAction.collectionBody}. ${songs[0] ? `"${songs[0].title}" is the record to fix first.` : "Your catalog has one clear fix first."} That is about ${formatGapEstimate(nextAction.estimatedValue)} sitting uncollected. Takes ${nextAction.estimatedTime}. Want me to walk you through it?`;

  return (
    <AppShell title="A" eyebrow="Manager">
      <main className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Chat panel */}
        <section className="overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">
          <header className="flex items-center justify-between border-b-[0.5px] border-white/10 bg-[#0d0d0b] px-5 py-4">
            <div>
              <div className="text-[15px] font-medium text-white">A</div>
              <div className="mt-1 text-xs text-white/35">Your manager · Always on</div>
            </div>
            <Link href="/mobile" className="text-2xl font-light text-white/35" aria-label="Close A">
              ×
            </Link>
          </header>

          <div className="flex max-h-[540px] min-h-[440px] flex-col overflow-y-auto px-5 py-5">
            {/* Greeting (shown until first real message) */}
            {!hasMessages && (
              <>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">A</div>
                <div className="max-w-[88%] rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white/80">
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
                  <div
                    className={
                      isUser
                        ? "max-w-[82%] rounded-xl rounded-br-sm bg-white px-4 py-3 text-sm leading-6 text-[#0d0d0b]"
                        : "max-w-[88%] rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white/80"
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
                <div className="flex gap-1 rounded-xl rounded-bl-sm border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Quick prompts (shown only when no messages yet) */}
            {!hasMessages && (
              <div className="mt-5 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submit(prompt)}
                    className="rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] px-3 py-2 text-xs text-white/65"
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
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask A anything..."
              disabled={isStreaming}
              className="h-10 flex-1 rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !draft.trim()}
              className="grid size-10 place-items-center rounded-full border-[0.5px] border-white/10 bg-[#1e1e1b] text-sm text-white/70 disabled:opacity-40"
            >
              →
            </button>
          </form>
        </section>

        {/* Sidebar */}
        <aside className="rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
          <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Manager context</div>
            <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">A knows the account first.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              {profile.artistName}, your catalog has {formatGapEstimate(summary.totalEstimatedGap)} estimated missing across {summary.songsWithGaps} songs.
            </p>
          </section>

          <section className="mt-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Top move</div>
            <p className="mt-3 text-sm leading-6 text-[#111]">
              {nextAction.title}. Gap impact: {formatGapEstimate(nextAction.estimatedValue)}. Time: {nextAction.estimatedTime}.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/projects/${nextAction.songId}`} className="rounded-lg bg-[#0d0d0b] px-4 py-2 text-sm text-white">
                Open Room
              </Link>
              <Link href="/actions" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
                See queue
              </Link>
            </div>
          </section>

          <section className="mt-5 rounded-xl border-[0.5px] border-[#e6f1fb] bg-[#e6f1fb] p-4 text-sm leading-6 text-[#185fa5]">
            A is model-provider agnostic. Use a cost-smart default for normal manager chat, then escalate only when the job needs deeper reasoning or document analysis.
          </section>

          <section className="mt-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b6b65]">Model strategy</div>
            <div className="space-y-3">
              {modelStrategy.map((item) => (
                <div key={item.label} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[15px] font-medium text-[#111]">{item.title}</div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#6b6b65]">{item.label}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#514d47]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </AppShell>
  );
}
