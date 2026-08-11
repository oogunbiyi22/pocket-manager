"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { LogoMark } from "@/components/logo";

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

const PILLARS = [
  {
    label: "Manager Brain",
    tag: "A — AI",
    body: "Ask about your gap, next move, ISRC, release windows, or any part of your catalog. Context-aware. Always in your corner.",
    color: "var(--electric)",
    bg: "rgba(124,111,239,0.06)",
    border: "rgba(124,111,239,0.18)",
  },
  {
    label: "Release Room",
    tag: "Planning",
    body: "Pre-release checklist with real checkpoints — metadata, distribution submission, platform delivery, outreach timing. Nothing slips.",
    color: "var(--green)",
    bg: "rgba(151,196,89,0.06)",
    border: "rgba(151,196,89,0.18)",
  },
  {
    label: "The Vault",
    tag: "Protection",
    body: "Masters, split sheets, contracts, and artwork in one place. Not scattered across email threads and USB drives.",
    color: "var(--cyan)",
    bg: "rgba(56,212,245,0.06)",
    border: "rgba(56,212,245,0.18)",
  },
  {
    label: "Pocket A&R",
    tag: "Outreach",
    body: "300+ venues, 150+ radio stations, 65 sync companies — with real booking contacts, not homepage links. Pitch from inside the app.",
    color: "var(--cyan)",
    bg: "rgba(56,212,245,0.06)",
    border: "rgba(56,212,245,0.18)",
  },
  {
    label: "Signal",
    tag: "Playlisting",
    body: "Match your song by genre, mood, and BPM to the right playlists. We generate the pitch. You send it. Track opens, replies, and placements.",
    color: "var(--amber)",
    bg: "rgba(239,159,39,0.06)",
    border: "rgba(239,159,39,0.18)",
  },
  {
    label: "The Gap Engine",
    tag: "Revenue",
    body: "SoundExchange, The MLC, PRO, YouTube Content ID, mechanical — we scan every door and show you exactly what's still closed.",
    color: "var(--amber)",
    bg: "rgba(239,159,39,0.06)",
    border: "rgba(239,159,39,0.18)",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Add your catalog",
    body: "Drop in a song title, ISRC, and release date. Pocket maps every royalty path — PRO, SoundExchange, The MLC, YouTube Content ID — and flags what's uncollected.",
    color: "var(--amber)",
  },
  {
    step: "02",
    title: "Close the Gap",
    body: "The Gap Engine shows you exactly which registrations are missing, ranks them by dollar value, and gives you step-by-step guides to fix each one.",
    color: "var(--electric)",
  },
  {
    step: "03",
    title: "Build momentum",
    body: "Pitch to curators with auto-generated emails, book venues with direct contacts, plan releases with the Radar, and let A handle strategy questions 24/7.",
    color: "var(--green)",
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
      <div className="glass-electric" style={{ borderRadius: 14, padding: "18px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>You&apos;re on the list.</div>
        <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>We&apos;ll reach out before launch. Tell one artist you trust.</p>
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
        className="glass-subtle"
        style={{ flex: 1, height: 46, borderRadius: 12, padding: "0 16px", fontSize: 14, color: "var(--text-primary)", outline: "none" }}
      />
      <button type="submit" disabled={status === "loading" || !email.trim()} className="btn-electric press" style={{ height: 46, opacity: status === "loading" ? 0.6 : 1 }}>
        {status === "loading" ? "Saving…" : "Get early access"}
      </button>
      {status === "error" && (
        <p style={{ width: "100%", textAlign: "center", fontSize: 12, color: "var(--red)" }}>Something went wrong — try again.</p>
      )}
    </form>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="label-upper" style={{ marginBottom: 16 }}>{children}</div>;
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--void)", color: "var(--text-primary)" }}>

      {/* Nav */}
      <header className="liquid-glass" style={{ position: "sticky", top: 0, zIndex: 40, padding: "max(14px, env(safe-area-inset-top)) 24px 14px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={30} />
            <div>
              <div className="label-upper" style={{ marginBottom: 0 }}>Pocket</div>
              <div style={{ marginTop: -2, fontSize: 15, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--text-primary)" }}>Manager</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/sign-in" className="hidden sm:block">
              <span className="btn-ghost press" style={{ padding: "8px 16px" }}>Sign in</span>
            </Link>
            <Link href="/sign-in?mode=sign-up">
              <span className="btn-electric press" style={{ padding: "8px 18px" }}>Start free</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", overflow: "hidden", padding: "clamp(72px,14vw,160px) 24px clamp(64px,10vw,120px)" }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 720, height: 480, pointerEvents: "none", background: "radial-gradient(ellipse, var(--electric-glow) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, marginBottom: 28 }}
            className="glass-subtle"
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--electric)" }} />
            <span className="label-upper" style={{ marginBottom: 0, color: "var(--text-secondary)" }}>Built for independent artists</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            style={{
              fontFamily: "var(--font-syne, inherit)",
              fontSize: "clamp(40px,7vw,84px)",
              fontWeight: 200,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              marginBottom: 28,
              color: "var(--text-primary)",
            }}
          >
            Your manager brain.
            <br />
            <span style={{ color: "var(--electric)" }}>In your pocket.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            style={{ maxWidth: 520, margin: "0 auto 40px", fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)" }}
          >
            From finishing the song to building real momentum. Pocket Manager handles the business, the outreach, the paperwork, and the strategy. So you can stay in the music.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 20 }}
          >
            <Link href="/sign-in?mode=sign-up">
              <span className="btn-electric press" style={{ padding: "14px 32px", fontSize: 15, borderRadius: 12 }}>Start for free</span>
            </Link>
            <Link href="/onboarding">
              <span className="btn-ghost press" style={{ padding: "14px 28px", fontSize: 15, borderRadius: 12 }}>See how it works →</span>
            </Link>
          </motion.div>
          <p style={{ fontSize: 12, color: "var(--text-dim)" }}>No credit card. No agency fees. Just the tools a real manager would use.</p>
        </div>
      </section>

      {/* Live dashboard preview */}
      <section style={{ borderTop: "0.5px solid var(--glass-border)", padding: "clamp(64px,10vw,120px) 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal className="text-center" style={{ marginBottom: 56 }}>
            <Eyebrow>System status · live</Eyebrow>
            <h2 style={{ fontFamily: "var(--font-syne, inherit)", fontSize: "clamp(28px,4.5vw,46px)", fontWeight: 200, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              What your catalog looks like<br />with a manager brain.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <Reveal delay={0.05} className="glass" style={{ borderRadius: 20, padding: 26 }}>
              <div className="label-upper" style={{ color: "var(--amber)" }}>Revenue gap</div>
              <div className="hud-stat-value" style={{ fontSize: 48, color: "var(--amber)", marginTop: 10 }}>$340+</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>3 unregistered platforms</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {["SoundExchange — $68 est.", "The MLC — $120 est.", "YouTube Content ID — $152 est."].map((item) => (
                  <div key={item} className="glass-subtle" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, fontSize: 12, color: "var(--text-secondary)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.12} className="glass" style={{ borderRadius: 20, padding: 26 }}>
              <div className="label-upper" style={{ color: "var(--green)" }}>Playlist signal</div>
              <div className="hud-stat-value" style={{ fontSize: 48, color: "var(--green)", marginTop: 10 }}>14</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>pitches in flight · 3 placed</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Late Night R&B", status: "Placed", color: "var(--green)" },
                  { label: "Chill Bedroom Beats", status: "Opened", color: "var(--amber)" },
                  { label: "Neo Soul Essentials", status: "Sent", color: "var(--text-dim)" },
                ].map((p) => (
                  <div key={p.label} className="glass-subtle" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 10, fontSize: 12 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.color }} />
                      <span style={{ color: "var(--text-muted)" }}>{p.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.19} className="glass" style={{ borderRadius: 20, padding: 26 }}>
              <div className="label-upper" style={{ color: "var(--electric)" }}>Release room</div>
              <div className="hud-stat-value" style={{ fontSize: 48, color: "var(--electric)", marginTop: 10 }}>7/12</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>steps complete · drop in 14 days</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Metadata complete", done: true },
                  { label: "Distribution submitted", done: true },
                  { label: "Platform pre-save live", done: false },
                  { label: "Curator pitches sent", done: false },
                ].map((step) => (
                  <div key={step.label} className="glass-subtle" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, fontSize: 12 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: step.done ? "var(--electric)" : "var(--text-dim)", flexShrink: 0 }} />
                    <span style={{ color: step.done ? "var(--text-secondary)" : "var(--text-muted)" }}>{step.label}</span>
                    {step.done && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--electric)" }}>✓</span>}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* What it actually is */}
      <section style={{ borderTop: "0.5px solid var(--glass-border)", padding: "clamp(64px,10vw,120px) 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ display: "grid", alignItems: "center", gap: 56, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            <Reveal>
              <Eyebrow>What this actually is</Eyebrow>
              <h2 style={{ fontFamily: "var(--font-syne, inherit)", fontSize: "clamp(30px,4vw,46px)", fontWeight: 200, letterSpacing: "-0.03em", color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 22 }}>
                Not a royalty tracker.<br />A partner.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-secondary)", marginBottom: 14 }}>
                Major labels have teams for this. Business managers, A&amp;R staff, publishing admins, booking agents, sync coordinators. They handle the messy middle between finishing a song and building momentum around it.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-secondary)" }}>
                Pocket Manager gives you that same infrastructure — without the label deal, the manager cut, or the guesswork.
              </p>
            </Reveal>
            <Reveal delay={0.1} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Without Pocket Manager", items: ["Royalties sitting uncollected", "No split sheet filed", "Pitch emails sitting in drafts", "Release dates missed", "Booking contacts buried in DMs"], positive: false },
                { label: "With Pocket Manager", items: ["Every revenue door tracked and opened", "Split sheets stored in the Vault", "AI-matched playlists pitched automatically", "Release Room with real checkpoints", "300+ venues with direct booking contacts"], positive: true },
              ].map((col) => (
                <div key={col.label} className={col.positive ? "glass-electric" : "glass-subtle"} style={{ borderRadius: 16, padding: 22 }}>
                  <div className="label-upper" style={{ color: col.positive ? "var(--electric)" : "var(--text-muted)" }}>{col.label}</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                    {col.items.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: col.positive ? "var(--text-secondary)" : "var(--text-muted)" }}>
                        <span style={{ flexShrink: 0, marginTop: 1, color: col.positive ? "var(--electric)" : "var(--text-dim)" }}>{col.positive ? "→" : "×"}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6 pillars */}
      <section style={{ borderTop: "0.5px solid var(--glass-border)", padding: "clamp(64px,10vw,120px) 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 48 }}>
            <Eyebrow>Everything in one place</Eyebrow>
            <h2 style={{ fontFamily: "var(--font-syne, inherit)", fontSize: "clamp(30px,4vw,46px)", fontWeight: 200, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 14 }}>From chaos to rollout.</h2>
            <p style={{ maxWidth: 460, fontSize: 15, lineHeight: 1.75, color: "var(--text-secondary)" }}>
              Six tools. One operating system. Built around the way music actually moves.
            </p>
          </Reveal>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {PILLARS.map((pillar, i) => (
              <Reveal key={pillar.label} delay={i * 0.05} className="glass-subtle" style={{ borderRadius: 18, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 17, fontWeight: 300, color: "var(--text-primary)" }}>{pillar.label}</div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: pillar.color, background: pillar.bg, border: `0.5px solid ${pillar.border}`, flexShrink: 0 }}>{pillar.tag}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)" }}>{pillar.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: "0.5px solid var(--glass-border)", padding: "clamp(64px,10vw,120px) 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <Reveal className="text-center" style={{ marginBottom: 48 }}>
            <Eyebrow>How it works</Eyebrow>
            <h2 style={{ fontFamily: "var(--font-syne, inherit)", fontSize: "clamp(28px,4vw,42px)", fontWeight: 200, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>Under 2 minutes to your first Gap.</h2>
          </Reveal>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {HOW_IT_WORKS.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.08} className="glass-subtle" style={{ borderRadius: 18, padding: 26 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: step.color, marginBottom: 16 }}>{step.step}</div>
                <div style={{ fontSize: 19, fontWeight: 300, color: "var(--text-primary)", marginBottom: 12 }}>{step.title}</div>
                <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)" }}>{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: "0.5px solid var(--glass-border)", padding: "clamp(80px,12vw,140px) 24px 100px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, pointerEvents: "none", background: "radial-gradient(ellipse, var(--electric-glow) 0%, transparent 70%)" }} />
        <Reveal style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontFamily: "var(--font-syne, inherit)", fontSize: "clamp(34px,6vw,64px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1.05, color: "var(--text-primary)", marginBottom: 24 }}>
            Everything around<br />the music.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 44 }}>
            So you can stay in the music.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Link href="/sign-in?mode=sign-up">
              <span className="btn-electric press" style={{ padding: "16px 44px", fontSize: 16, borderRadius: 14 }}>Start for free — no card needed</span>
            </Link>
            <WaitlistForm />
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-dim)" }}>Free plan available. Built for independent artists. Cancel anytime.</p>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "0.5px solid var(--glass-border)", padding: "24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 12, color: "var(--text-dim)" }}>
          <span>Pocket Manager · Your manager brain in your pocket · Built for independent artists</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/terms"><span style={{ color: "var(--text-dim)" }}>Terms</span></Link>
            <Link href="/privacy"><span style={{ color: "var(--text-dim)" }}>Privacy</span></Link>
            <Link href="/sign-in"><span style={{ color: "var(--text-dim)" }}>Sign in</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
