"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/logo";

const PILLARS = [
  {
    label: "Manager Brain",
    tag: "A — AI",
    body: "Ask about your gap, next move, ISRC, release windows, or any part of your catalog. Context-aware. Always in your corner.",
    accent: "#ef9f27",
  },
  {
    label: "Release Room",
    tag: "Planning",
    body: "Pre-release checklist with real checkpoints — metadata, distribution submission, platform delivery, outreach timing. Nothing slips.",
    accent: "#97c459",
  },
  {
    label: "The Vault",
    tag: "Protection",
    body: "Masters, split sheets, contracts, and artwork stored in one place. Not scattered across email threads and USB drives.",
    accent: "#6c9fcf",
  },
  {
    label: "Pocket A&R",
    tag: "Outreach",
    body: "300+ venues, 150+ radio stations, 65 sync companies — with real booking contacts, not homepage links. Pitch from inside the app.",
    accent: "#c47fcf",
  },
  {
    label: "Signal",
    tag: "Playlisting",
    body: "Match your song by genre, mood, and BPM to the right playlists. We generate the pitch. You send it. Track opens, replies, and placements.",
    accent: "#cf7f7f",
  },
  {
    label: "The Gap Engine",
    tag: "Revenue",
    body: "SoundExchange, The MLC, PRO, YouTube Content ID, mechanical — we scan every door and show you exactly what's still closed.",
    accent: "#9fcfb0",
  },
];

const SOCIAL_PROOF = [
  {
    quote: "It actually thinks like a manager. Told me my SoundExchange registration was missing and walked me through fixing it in 10 minutes.",
    name: "Marcus T.",
    context: "Producer, Atlanta",
  },
  {
    quote: "The pitch email it generated for my track matched the playlist's vibe exactly. Got a reply the same day.",
    name: "Anya S.",
    context: "Independent R&B artist, Toronto",
  },
  {
    quote: "I had three releases with no split sheets filed. Vault caught that. Now I sleep better.",
    name: "Devon K.",
    context: "Songwriter & producer, Los Angeles",
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
      <section className="relative overflow-hidden px-5 pb-24 pt-20 sm:pb-36 sm:pt-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-[#ef9f27]/[0.04] blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
            Built for independent artists
          </div>
          <h1 className="max-w-4xl text-[52px] font-light leading-[1.02] tracking-[-0.04em] sm:text-[72px] lg:text-[88px]">
            Your manager brain.<br className="hidden sm:block" />
            <span className="text-[#ef9f27]">In your pocket.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-8 text-white/45">
            From finishing the song to building real momentum — Pocket Manager handles the business, the outreach, the paperwork, and the strategy. So you can stay in the music.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/sign-in?mode=sign-up"
              className="rounded-xl bg-white px-8 py-4 text-[15px] font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]"
            >
              Start for free
            </Link>
            <Link
              href="/onboarding"
              className="rounded-xl border border-white/15 px-8 py-4 text-[15px] text-white/50 transition hover:border-white/30 hover:text-white/80 active:scale-[0.98]"
            >
              See how it works →
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/20">No credit card. No agency fees. Just the tools a real manager would use.</p>
        </div>
      </section>

      {/* The real pitch — not just money */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">What this actually is</div>
              <h2 className="mt-5 text-[36px] font-light leading-[1.1] tracking-[-0.03em] sm:text-[48px]">
                Not a royalty tracker.<br />A partner.
              </h2>
              <p className="mt-6 text-[15px] leading-8 text-white/45">
                Major labels have teams for this. Business managers, A&R staff, publishing admins, booking agents, sync coordinators. They handle the messy middle between finishing a song and building momentum around it.
              </p>
              <p className="mt-4 text-[15px] leading-8 text-white/45">
                Pocket Manager gives you that same infrastructure — everything from split sheets to sync pitches to playlist placement — without the label deal, the manager cut, or the guesswork.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Without Pocket Manager", items: ["Royalties sitting uncollected", "No split sheet filed", "Pitch emails sitting in drafts", "Release dates missed", "Booking contacts buried in DMs"] },
                { label: "With Pocket Manager", items: ["Every revenue door tracked and opened", "Split sheets stored in the Vault", "AI-matched playlists pitched automatically", "Release Room with real checkpoints", "300+ venues with direct booking contacts"], positive: true },
              ].map((col) => (
                <div key={col.label} className={`rounded-2xl border p-5 ${col.positive ? "border-[#97c459]/25 bg-[#97c459]/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                  <div className={`mb-3 text-[11px] font-medium uppercase tracking-[0.18em] ${col.positive ? "text-[#97c459]/70" : "text-white/25"}`}>{col.label}</div>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className={`flex items-start gap-2.5 text-[13px] ${col.positive ? "text-white/70" : "text-white/30 line-through decoration-white/20"}`}>
                        <span className="mt-0.5 shrink-0">{col.positive ? "→" : "×"}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 Pillars */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">Everything in one place</div>
            <h2 className="mt-5 text-[36px] font-light tracking-[-0.03em] sm:text-[48px]">
              From chaos to rollout.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/40">
              Six tools. One operating system. Built around the way music actually moves.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.label}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="text-[18px] font-light text-white">{pillar.label}</div>
                  <span
                    className="mt-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em]"
                    style={{ color: pillar.accent, backgroundColor: `${pillar.accent}18` }}
                  >
                    {pillar.tag}
                  </span>
                </div>
                <p className="text-[13px] leading-6 text-white/40">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live dashboard preview */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">Inside the app</div>
            <h2 className="mt-5 text-[36px] font-light tracking-[-0.03em] sm:text-[44px]">
              What your catalog looks like<br className="hidden sm:block" /> with a manager brain.
            </h2>
          </div>
          {/* Mock app cards */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Gap card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#ef9f27]/60">Revenue gap</div>
              <div className="mt-3 text-[44px] font-light tracking-[-0.04em] text-[#ef9f27]">$340+</div>
              <div className="mt-2 text-sm text-white/35">3 unregistered platforms</div>
              <div className="mt-5 space-y-2">
                {["SoundExchange — $68 est.", "The MLC — $120 est.", "YouTube Content ID — $152 est."].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] text-white/50">
                    <div className="size-1.5 rounded-full bg-[#ef9f27]/60" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Pitch score card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#97c459]/60">Playlist signal</div>
              <div className="mt-3 text-[44px] font-light tracking-[-0.04em] text-white">14</div>
              <div className="mt-2 text-sm text-white/35">pitches in flight · 3 placed</div>
              <div className="mt-5 space-y-2">
                {[
                  { label: "Late Night R&B", status: "Placed", color: "bg-[#97c459]" },
                  { label: "Chill Bedroom Beats", status: "Opened", color: "bg-[#ef9f27]" },
                  { label: "Neo Soul Essentials", status: "Sent", color: "bg-white/20" },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-[12px]">
                    <span className="text-white/55">{p.label}</span>
                    <span className="flex items-center gap-1.5">
                      <div className={`size-1.5 rounded-full ${p.color}`} />
                      <span className="text-white/35">{p.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Release room card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#6c9fcf]/60">Release room</div>
              <div className="mt-3 text-[44px] font-light tracking-[-0.04em] text-white">7/12</div>
              <div className="mt-2 text-sm text-white/35">steps complete · drop in 14 days</div>
              <div className="mt-5 space-y-2">
                {[
                  { label: "Metadata complete", done: true },
                  { label: "Distribution submitted", done: true },
                  { label: "Platform pre-save live", done: false },
                  { label: "Curator pitches sent", done: false },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px]">
                    <div className={`size-1.5 rounded-full ${step.done ? "bg-[#6c9fcf]" : "bg-white/15"}`} />
                    <span className={step.done ? "text-white/55" : "text-white/25"}>{step.label}</span>
                    {step.done && <span className="ml-auto text-[10px] text-[#6c9fcf]/60">Done</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signal auto-pitching highlight */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0f1109]">
            <div className="grid items-center gap-0 lg:grid-cols-2">
              <div className="p-10 lg:p-14">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#97c459]/60">Signal — auto pitching</div>
                <h2 className="mt-5 text-[36px] font-light leading-[1.1] tracking-[-0.03em]">
                  We pitch your songs.<br />You watch the results.
                </h2>
                <p className="mt-6 text-[15px] leading-8 text-white/40">
                  Type your song, mood, and genre. Pocket Manager matches it to the right playlists and generates a pitch email that fits the curator&apos;s vibe — not generic copy-paste.
                </p>
                <p className="mt-4 text-[15px] leading-8 text-white/40">
                  When a curator opens your pitch or replies, you get notified. When it&apos;s placed or declined, the score updates automatically. No manual status clicking.
                </p>
                <Link
                  href="/sign-in?mode=sign-up"
                  className="mt-8 inline-block rounded-xl bg-[#97c459] px-7 py-3.5 text-[14px] font-semibold text-[#0d0d0b] transition hover:bg-[#a8d46a] active:scale-[0.98]"
                >
                  Start pitching free →
                </Link>
              </div>
              <div className="border-t border-white/[0.06] p-8 lg:border-l lg:border-t-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/25">Pitch score — "Late Nights"</div>
                {/* Score meter visual */}
                <div className="mt-6 flex items-center gap-6">
                  <div className="relative flex size-28 shrink-0 items-center justify-center">
                    <svg className="absolute inset-0" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <circle cx="56" cy="56" r="48" fill="none" stroke="#97c459" strokeWidth="8"
                        strokeDasharray={`${0.58 * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                        strokeLinecap="round" transform="rotate(-90 56 56)" />
                    </svg>
                    <div className="text-center">
                      <div className="text-[28px] font-light text-white">58%</div>
                      <div className="text-[10px] text-white/30">engaged</div>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    {[
                      { label: "Sent", count: "14", color: "bg-white/20" },
                      { label: "Opened", count: "8", color: "bg-[#ef9f27]" },
                      { label: "Placed", count: "3", color: "bg-[#97c459]" },
                      { label: "Declined", count: "2", color: "bg-[#e24b4a]/60" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2.5">
                        <div className={`size-2 shrink-0 rounded-full ${s.color}`} />
                        <span className="text-[12px] text-white/40 flex-1">{s.label}</span>
                        <span className="text-[12px] text-white/70">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {[
                    { name: "Late Night R&B", fit: 94, status: "Placed", badge: "bg-[#97c459]/15 text-[#97c459]" },
                    { name: "Bedroom Soul", fit: 89, status: "Opened", badge: "bg-[#ef9f27]/15 text-[#ef9f27]" },
                    { name: "Smooth After Hours", fit: 82, status: "Sent", badge: "bg-white/[0.08] text-white/40" },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <div>
                        <div className="text-[13px] text-white/70">{p.name}</div>
                        <div className="text-[10px] text-white/25">{p.fit}% fit</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${p.badge}`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Guild */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">The Guild</div>
              <h2 className="mt-5 text-[36px] font-light tracking-[-0.03em] sm:text-[44px]">
                Your network makes<br className="hidden sm:block" /> the work move.
              </h2>
              <p className="mt-6 text-[15px] leading-8 text-white/40">
                Find producers, songwriters, vocalists, and featured artists who match your sound. Browse catalogs, not profiles. Invite collaborators directly into your project.
              </p>
              <Link
                href="/guild"
                className="mt-8 inline-block rounded-xl border border-white/15 px-6 py-3 text-sm text-white/55 transition hover:border-white/30 hover:text-white/80"
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
                      <span key={g} className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[10px] text-white/45">{g}</span>
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
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">From the community</div>
            <h2 className="mt-5 text-[32px] font-light tracking-[-0.03em]">Artists who stopped guessing.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {SOCIAL_PROOF.map((p) => (
              <div key={p.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <p className="text-[15px] font-light leading-7 text-white/70">&ldquo;{p.quote}&rdquo;</p>
                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <div className="text-sm font-medium text-white">{p.name}</div>
                  <div className="text-xs text-white/30">{p.context}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vault highlight */}
      <section className="border-t border-white/[0.06] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-8 py-12 text-center sm:px-16 sm:py-16">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">The Vault</div>
            <h2 className="mx-auto mt-5 max-w-2xl text-[36px] font-light tracking-[-0.03em] sm:text-[44px]">
              Protect the work first.<br />Everything else follows.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-8 text-white/40">
              Split sheets, master recordings, contracts, artwork, and licensing agreements in one place. If you&apos;ve ever lost a file, missed a royalty window, or had a split dispute — the Vault stops all of that.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {["Split sheets", "Master WAVs", "Publishing agreements", "Artwork files", "Sync licenses", "Tour riders"].map((item) => (
                <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[12px] text-white/45">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/[0.06] px-5 py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[48px] font-light leading-[1.05] tracking-[-0.03em] sm:text-[60px]">
            Everything around<br />the music.
          </h2>
          <p className="mt-6 text-[17px] leading-8 text-white/40">
            So you can stay in the music.
          </p>
          <div className="mt-12 flex flex-col items-center gap-5">
            <Link
              href="/sign-in?mode=sign-up"
              className="rounded-xl bg-white px-12 py-4 text-[15px] font-semibold text-[#0d0d0b] transition hover:bg-white/90 active:scale-[0.98]"
            >
              Start for free — no card needed
            </Link>
            <div className="flex justify-center">
              <WaitlistForm />
            </div>
          </div>
          <p className="mt-6 text-xs text-white/20">Free plan available. Built for independent artists. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[11px] text-white/20 sm:flex-row">
          <span>Pocket Manager · Your manager brain in your pocket · Built for independent artists</span>
          <div className="flex gap-5">
            <Link href="/terms" className="transition hover:text-white/40">Terms</Link>
            <Link href="/privacy" className="transition hover:text-white/40">Privacy</Link>
            <Link href="/sign-in" className="transition hover:text-white/40">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
