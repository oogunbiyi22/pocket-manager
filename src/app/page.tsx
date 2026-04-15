"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/logo";

const PAIN_POINTS = [
  {
    headline: "Your royalties are sitting somewhere uncollected.",
    body: "SoundExchange, The MLC, your PRO — each one holds money for artists who never registered. Most artists never find out.",
  },
  {
    headline: "Your distributor isn't your whole picture.",
    body: "Streaming payouts are one slice. Digital performance royalties, mechanical royalties, sync, YouTube Content ID — most of it goes unclaimed.",
  },
  {
    headline: "Major labels have teams for this. You don't.",
    body: "Their A&R staff, business managers, and publishing admins close every gap automatically. Independent artists are left to figure it out alone.",
  },
  {
    headline: "Every day you wait is money that expires.",
    body: "Some royalty pools have collection windows. Miss them and the money gets redistributed. It doesn't wait for you.",
  },
];

const SOCIAL_PROOF = [
  {
    quote: "Found $340 in SoundExchange money I didn't even know existed. Took me 12 minutes.",
    name: "Marcus",
    context: "R&B producer, Atlanta",
  },
  {
    quote: "I thought my distributor handled everything. Pocket Manager showed me three open gaps on my first single alone.",
    name: "Tanya L.",
    context: "Independent artist, Toronto",
  },
  {
    quote: "The action queue is like having a manager tell you exactly what to do next. Nothing is vague.",
    name: "Devon K.",
    context: "Songwriter & producer, Los Angeles",
  },
];

const FEATURES = [
  {
    label: "The Gap Engine",
    body: "Scans every revenue path — streaming, PRO, SoundExchange, The MLC, YouTube — and surfaces exactly what's uncollected.",
  },
  {
    label: "Next Action Engine",
    body: "Prioritized by dollar value and ease. One clear move at a time. Never a list of 40 things.",
  },
  {
    label: "Platform Connection",
    body: "Step-by-step guides to register on every collection platform. Deep links, not homepages.",
  },
  {
    label: "The Guild",
    body: "Find producers, songwriters, and vocalists who match your vibe. Browse catalogs, not profiles.",
  },
  {
    label: "A — AI Manager",
    body: "Context-aware chat wired directly to your catalog. Knows your gaps, your next action, your ISRC.",
  },
  {
    label: "Release Radar",
    body: "Pre-release countdown with real checkpoints — metadata, distribution, platform delivery, outreach.",
  },
];

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "landing" }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-[#ef9f27]/30 bg-[#ef9f27]/10 px-6 py-5 text-center">
        <div className="text-[15px] font-medium text-[#ef9f27]">You&apos;re on the list.</div>
        <p className="mt-1 text-sm text-white/45">We&apos;ll reach out before launch. Tell one artist you trust.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="h-12 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/35"
      />
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="h-12 rounded-xl bg-[#ef9f27] px-6 text-sm font-semibold text-[#0d0d0b] transition hover:bg-[#f5b048] disabled:opacity-50 active:scale-[0.98]"
      >
        {status === "loading" ? "Saving…" : "Get early access"}
      </button>
      {status === "error" && (
        <p className="w-full text-center text-xs text-[#e24b4a]">Something went wrong — try again.</p>
      )}
    </form>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d0b] text-white">

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[rgba(13,13,11,0.88)] px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Pocket</div>
              <div className="-mt-0.5 text-[16px] font-normal tracking-[-0.02em] leading-none text-white">Manager</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm text-white/55 transition hover:border-white/25 hover:text-white/80 sm:block">
              Sign in
            </Link>
            <Link href="/sign-in?mode=sign-up" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0d0d0b] transition hover:bg-white/90">
              Start free →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-20 sm:py-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-[#ef9f27]/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-[#ef9f27]/40 bg-[#ef9f27]/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#ef9f27]">
            Artist revenue intelligence
          </div>
          <h1 className="text-[52px] font-light leading-[1.02] tracking-[-0.04em] sm:text-[72px] lg:text-[84px]">
            Stop leaving your money<br className="hidden sm:block" /> on the table.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/50">
            Pocket Manager finds the royalties you&apos;re missing, tells you exactly how to collect them, and gives independent artists the same financial infrastructure as major-label acts.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-in?mode=sign-up"
              className="rounded-xl bg-white px-8 py-4 text-[15px] font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]"
            >
              Start for free — no card needed
            </Link>
            <Link
              href="/onboarding"
              className="rounded-xl border border-white/15 px-8 py-4 text-[15px] text-white/60 transition hover:border-white/30 hover:text-white/80 active:scale-[0.98]"
            >
              See your gap first →
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/25">Free plan available. No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Problem — make them feel seen */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The real situation</div>
            <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em] sm:text-[44px]">
              You&apos;re probably losing money <br className="hidden sm:block" />right now.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {PAIN_POINTS.map((p) => (
              <div key={p.headline} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
                <p className="text-[17px] font-medium leading-7 text-white">{p.headline}</p>
                <p className="mt-3 text-sm leading-7 text-white/50">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution preview — what the product actually does */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">How it works</div>
            <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em] sm:text-[44px]">
              Major-label infrastructure. <br className="hidden sm:block" />Independent price.
            </h2>
          </div>

          {/* Mock dashboard card */}
          <div className="mb-12 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-[#e24b4a]/60" />
                <div className="size-2.5 rounded-full bg-[#ef9f27]/60" />
                <div className="size-2.5 rounded-full bg-[#97c459]/60" />
                <span className="ml-2 text-[11px] text-white/25">Pocket Manager — The Situation</span>
              </div>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
              <div className="border-b border-white/[0.06] p-6 sm:border-b-0 sm:border-r">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">Secured this quarter</div>
                <div className="mt-3 text-[40px] font-light tracking-[-0.04em] text-white">$1,247</div>
                <div className="mt-2 text-sm text-white/35">4 active collection paths</div>
              </div>
              <div className="border-b border-white/[0.06] bg-[#ef9f27]/[0.06] p-6 sm:border-b-0 sm:border-r">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#ef9f27]/70">The Gap — uncollected</div>
                <div className="mt-3 text-[40px] font-light tracking-[-0.04em] text-[#ef9f27]">$340+</div>
                <div className="mt-2 text-sm text-[#ef9f27]/50">3 open fixes · register now</div>
              </div>
              <div className="p-6">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">Next action</div>
                <div className="mt-3 text-[15px] font-normal leading-6 text-white">Register with SoundExchange</div>
                <div className="mt-1 text-xs text-white/35">$68 est. · 10 minutes</div>
                <div className="mt-4 rounded-lg bg-white/10 px-4 py-2.5 text-center text-sm font-medium text-white">
                  Start now →
                </div>
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-6 py-3">
              <span className="text-[11px] text-white/25">↑ This found $340 in unclaimed royalties in under 5 minutes</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ef9f27]/70">{f.label}</div>
                <p className="mt-3 text-sm leading-7 text-white/55">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guild / Community */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">The Guild</div>
              <h2 className="mt-4 text-[36px] font-light tracking-[-0.03em] sm:text-[44px]">
                Artists who use Pocket Manager find collaborators, not just features.
              </h2>
              <p className="mt-6 text-[15px] leading-8 text-white/50">
                Browse producer catalogs. Find songwriters with your vibe. Invite collaborators directly into your project. The Guild is a discovery layer built for professionals.
              </p>
              <Link
                href="/guild"
                className="mt-8 inline-block rounded-xl border border-white/15 px-6 py-3 text-sm text-white/60 transition hover:border-white/30 hover:text-white/80"
              >
                Browse The Guild →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Nova Keys", role: "Producer", genres: ["Lo-fi", "Soul"], open: true },
                { name: "Remy Sol", role: "Songwriter", genres: ["R&B", "Neo Soul"], open: true },
                { name: "Ayo J", role: "Artist", genres: ["Afrobeats", "R&B"], open: false },
                { name: "Lena Moore", role: "Vocalist", genres: ["Soul", "Gospel"], open: true },
              ].map((m) => (
                <div key={m.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-medium text-white">
                      {m.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-white">{m.name}</div>
                      <div className="text-[11px] text-white/40">{m.role}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.genres.map((g) => (
                      <span key={g} className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[10px] text-white/50">{g}</span>
                    ))}
                    {m.open && (
                      <span className="rounded-full bg-[#97c459]/15 px-2.5 py-0.5 text-[10px] text-[#97c459]">Open</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">From the community</div>
            <h2 className="mt-4 text-[32px] font-light tracking-[-0.03em]">Artists who stopped guessing.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {SOCIAL_PROOF.map((p) => (
              <div key={p.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <p className="text-[15px] font-light leading-7 text-white/80">&ldquo;{p.quote}&rdquo;</p>
                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <div className="text-sm font-medium text-white">{p.name}</div>
                  <div className="text-xs text-white/35">{p.context}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.06] px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-[#ef9f27]/40 bg-[#ef9f27]/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#ef9f27]">
            Early access — limited spots
          </div>
          <h2 className="text-[44px] font-light tracking-[-0.03em] sm:text-[52px]">
            Your money is waiting.<br />How long will you wait?
          </h2>
          <p className="mt-6 text-[15px] leading-8 text-white/45">
            First 100 artists get founding member pricing — locked forever. We&apos;re building the tool we wish existed.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/sign-in?mode=sign-up"
              className="rounded-xl bg-white px-10 py-4 text-[15px] font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]"
            >
              Start for free — no card needed
            </Link>
            <div className="mt-4 flex justify-center">
              <WaitlistForm />
            </div>
          </div>
          <p className="mt-6 text-xs text-white/25">No credit card. No spam. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[11px] text-white/20 sm:flex-row">
          <span>Pocket Manager · Creator revenue intelligence · Independent artists only</span>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-white/40 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white/40 transition">Privacy</Link>
            <Link href="/sign-in" className="hover:text-white/40 transition">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
