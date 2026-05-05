"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/logo";

const PILLARS = [
  {
    label: "Manager Brain",
    tag: "A — AI",
    body: "Ask about your gap, next move, ISRC, release windows, or any part of your catalog. Context-aware. Always in your corner.",
    color: "var(--cyan)",
    glow: "rgba(0,212,255,0.15)",
  },
  {
    label: "Release Room",
    tag: "Planning",
    body: "Pre-release checklist with real checkpoints — metadata, distribution submission, platform delivery, outreach timing. Nothing slips.",
    color: "var(--green)",
    glow: "rgba(16,240,144,0.12)",
  },
  {
    label: "The Vault",
    tag: "Protection",
    body: "Masters, split sheets, contracts, and artwork in one place. Not scattered across email threads and USB drives.",
    color: "var(--purple)",
    glow: "rgba(168,85,247,0.15)",
  },
  {
    label: "Pocket A&R",
    tag: "Outreach",
    body: "300+ venues, 150+ radio stations, 65 sync companies — with real booking contacts, not homepage links. Pitch from inside the app.",
    color: "var(--cyan)",
    glow: "rgba(0,212,255,0.12)",
  },
  {
    label: "Signal",
    tag: "Playlisting",
    body: "Match your song by genre, mood, and BPM to the right playlists. We generate the pitch. You send it. Track opens, replies, and placements.",
    color: "var(--amber)",
    glow: "rgba(255,179,0,0.12)",
  },
  {
    label: "The Gap Engine",
    tag: "Revenue",
    body: "SoundExchange, The MLC, PRO, YouTube Content ID, mechanical — we scan every door and show you exactly what's still closed.",
    color: "var(--green)",
    glow: "rgba(16,240,144,0.12)",
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
      <div style={{ borderRadius: 16, border: "0.5px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--cyan)" }}>You&apos;re on the list.</div>
        <p style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>We&apos;ll reach out before launch. Tell one artist you trust.</p>
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
        style={{ flex: 1, height: 48, borderRadius: 12, border: "0.5px solid rgba(0,212,255,0.15)", background: "rgba(0,212,255,0.04)", padding: "0 16px", fontSize: 14, color: "#fff", outline: "none" }}
      />
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        style={{ height: 48, borderRadius: 12, background: "linear-gradient(135deg, var(--purple) 0%, var(--cyan) 100%)", border: "none", padding: "0 24px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap", opacity: status === "loading" ? 0.6 : 1 }}
      >
        {status === "loading" ? "Saving…" : "Get early access"}
      </button>
      {status === "error" && (
        <p style={{ width: "100%", textAlign: "center", fontSize: 12, color: "var(--red)" }}>Something went wrong — try again.</p>
      )}
    </form>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--void)", color: "var(--text-primary)" }}>

      {/* Nav — HUD glass bar */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        padding: "14px 20px",
        background: "rgba(0,0,14,0.92)",
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        borderBottom: "0.5px solid rgba(0,212,255,0.07)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={32} />
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(0,212,255,0.4)", fontFamily: "monospace" }}>Pocket</div>
              <div style={{ marginTop: -2, fontSize: 16, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1, color: "#fff" }}>Manager</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/sign-in"
              style={{ display: "none" }}
              className="sm:block"
            >
              <span style={{ padding: "6px 16px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.1)", fontSize: 13, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.03)" }}>
                Sign in
              </span>
            </Link>
            <Link href="/sign-in?mode=sign-up">
              <span style={{ padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(0,212,255,0.25) 100%)", border: "0.5px solid rgba(0,212,255,0.3)", fontSize: 13, fontWeight: 500, color: "var(--cyan)", boxShadow: "0 0 16px rgba(0,212,255,0.1)" }}>
                Start free →
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — deep space command center */}
      <section style={{ position: "relative", overflow: "hidden", padding: "100px 20px 120px" }}>
        {/* Aurora orbs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "10%", left: "5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: "5%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,212,255,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(16,240,144,0.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
          {/* Scan line */}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.01) 2px, rgba(0,212,255,0.01) 4px)" }} />
        </div>

        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: "0.5px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.05)", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(0,212,255,0.7)", fontFamily: "monospace" }}>Built for independent artists</span>
          </div>

          <h1 className="display-xl" style={{ maxWidth: 900, marginBottom: 32, color: "#fff" }}>
            Your manager brain.<br />
            <span style={{ color: "var(--cyan)", textShadow: "0 0 40px rgba(0,212,255,0.4)" }}>In your pocket.</span>
          </h1>

          <p style={{ maxWidth: 560, fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.4)", marginBottom: 48 }}>
            From finishing the song to building real momentum. Pocket Manager handles the business, the outreach, the paperwork, and the strategy. So you can stay in the music.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <Link href="/sign-in?mode=sign-up">
              <span style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(0,212,255,0.3) 100%)", border: "0.5px solid rgba(0,212,255,0.4)", fontSize: 15, fontWeight: 500, color: "#fff", boxShadow: "0 0 24px rgba(0,212,255,0.15), 0 4px 20px rgba(0,0,0,0.5)", cursor: "pointer" }}>
                Start for free
              </span>
            </Link>
            <Link href="/onboarding">
              <span style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.1)", fontSize: 15, color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
                See how it works →
              </span>
            </Link>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em" }}>No credit card. No agency fees. Just the tools a real manager would use.</p>
        </div>
      </section>

      {/* Live dashboard — HUD stat preview */}
      <section style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)", padding: "80px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(0,212,255,0.4)", fontFamily: "monospace", marginBottom: 16 }}>System status · live</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 200, letterSpacing: "-0.04em", color: "#fff" }}>
              What your catalog looks like<br />with a manager brain.
            </h2>
          </div>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {/* Revenue gap card */}
            <div style={{ borderRadius: 20, padding: 24, background: "rgba(255,179,0,0.04)", border: "0.5px solid rgba(255,179,0,0.15)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(ellipse, rgba(255,179,0,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,179,0,0.5)", fontFamily: "monospace", marginBottom: 12 }}>Revenue gap</div>
              <div style={{ fontSize: 52, fontWeight: 100, letterSpacing: "-0.05em", color: "var(--amber)", textShadow: "0 0 30px rgba(255,179,0,0.3)", lineHeight: 1 }}>$340+</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>3 unregistered platforms</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {["SoundExchange — $68 est.", "The MLC — $120 est.", "YouTube Content ID — $152 est."].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(255,179,0,0.06)", border: "0.5px solid rgba(255,179,0,0.1)", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Playlist signal */}
            <div style={{ borderRadius: 20, padding: 24, background: "rgba(16,240,144,0.03)", border: "0.5px solid rgba(16,240,144,0.12)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(ellipse, rgba(16,240,144,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(16,240,144,0.5)", fontFamily: "monospace", marginBottom: 12 }}>Playlist signal</div>
              <div style={{ fontSize: 52, fontWeight: 100, letterSpacing: "-0.05em", color: "var(--green)", textShadow: "0 0 30px rgba(16,240,144,0.3)", lineHeight: 1 }}>14</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>pitches in flight · 3 placed</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Late Night R&B", status: "Placed", color: "var(--green)" },
                  { label: "Chill Bedroom Beats", status: "Opened", color: "var(--amber)" },
                  { label: "Neo Soul Essentials", status: "Sent", color: "rgba(255,255,255,0.2)" },
                ].map((p) => (
                  <div key={p.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, background: "rgba(16,240,144,0.04)", border: "0.5px solid rgba(16,240,144,0.08)", fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.color }} />
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Release room */}
            <div style={{ borderRadius: 20, padding: 24, background: "rgba(0,212,255,0.03)", border: "0.5px solid rgba(0,212,255,0.12)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(0,212,255,0.5)", fontFamily: "monospace", marginBottom: 12 }}>Release room</div>
              <div style={{ fontSize: 52, fontWeight: 100, letterSpacing: "-0.05em", color: "var(--cyan)", textShadow: "0 0 30px rgba(0,212,255,0.3)", lineHeight: 1 }}>7/12</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>steps complete · drop in 14 days</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Metadata complete", done: true },
                  { label: "Distribution submitted", done: true },
                  { label: "Platform pre-save live", done: false },
                  { label: "Curator pitches sent", done: false },
                ].map((step) => (
                  <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(0,212,255,0.04)", border: "0.5px solid rgba(0,212,255,0.08)", fontSize: 12 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: step.done ? "var(--cyan)" : "rgba(255,255,255,0.15)", boxShadow: step.done ? "0 0 6px var(--cyan)" : "none", flexShrink: 0 }} />
                    <span style={{ color: step.done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", textDecoration: step.done ? "none" : "none" }}>{step.label}</span>
                    {step.done && <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(0,212,255,0.5)", fontFamily: "monospace" }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What it actually is */}
      <section style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)", padding: "80px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", alignItems: "center", gap: 48, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", marginBottom: 20 }}>What this actually is</div>
              <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 200, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, marginBottom: 24 }}>
                Not a royalty tracker.<br />A partner.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
                Major labels have teams for this. Business managers, A&R staff, publishing admins, booking agents, sync coordinators. They handle the messy middle between finishing a song and building momentum around it.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.35)" }}>
                Pocket Manager gives you that same infrastructure — without the label deal, the manager cut, or the guesswork.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Without Pocket Manager", items: ["Royalties sitting uncollected", "No split sheet filed", "Pitch emails sitting in drafts", "Release dates missed", "Booking contacts buried in DMs"], positive: false },
                { label: "With Pocket Manager", items: ["Every revenue door tracked and opened", "Split sheets stored in the Vault", "AI-matched playlists pitched automatically", "Release Room with real checkpoints", "300+ venues with direct booking contacts"], positive: true },
              ].map((col) => (
                <div key={col.label} style={{ borderRadius: 16, padding: 20, border: `0.5px solid ${col.positive ? "rgba(16,240,144,0.2)" : "rgba(255,255,255,0.05)"}`, background: col.positive ? "rgba(16,240,144,0.04)" : "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "monospace", color: col.positive ? "rgba(16,240,144,0.6)" : "rgba(255,255,255,0.2)", marginBottom: 12 }}>{col.label}</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.items.map((item) => (
                      <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: col.positive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", textDecoration: col.positive ? "none" : "line-through", textDecorationColor: "rgba(255,255,255,0.1)" }}>
                        <span style={{ flexShrink: 0, marginTop: 1 }}>{col.positive ? "→" : "×"}</span>
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

      {/* 6 pillars — plasma grid */}
      <section style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)", padding: "80px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", marginBottom: 16 }}>Everything in one place</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 200, letterSpacing: "-0.04em", color: "#fff", marginBottom: 16 }}>From chaos to rollout.</h2>
            <p style={{ maxWidth: 480, fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.3)" }}>
              Six tools. One operating system. Built around the way music actually moves.
            </p>
          </div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {PILLARS.map((pillar) => (
              <div
                key={pillar.label}
                style={{ borderRadius: 20, padding: 24, border: `0.5px solid rgba(255,255,255,0.06)`, background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden", cursor: "default", transition: "border-color 0.2s" }}
              >
                <div style={{ position: "absolute", top: 0, right: 0, width: 160, height: 160, background: `radial-gradient(ellipse, ${pillar.glow} 0%, transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 300, color: "#fff" }}>{pillar.label}</div>
                  <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", color: pillar.color, background: `${pillar.glow}`, border: `0.5px solid ${pillar.color}30`, flexShrink: 0 }}>{pillar.tag}</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.35)" }}>{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)", padding: "80px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", marginBottom: 16 }}>From the community</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 200, letterSpacing: "-0.04em", color: "#fff" }}>Artists who stopped guessing.</h2>
          </div>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {SOCIAL_PROOF.map((p, i) => (
              <div key={p.name} style={{ borderRadius: 20, padding: 24, border: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 100, height: 100, background: `radial-gradient(ellipse, ${["rgba(0,212,255,0.08)", "rgba(168,85,247,0.08)", "rgba(16,240,144,0.06)"][i]} 0%, transparent 70%)` }} />
                <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", fontStyle: "italic", marginBottom: 20 }}>&ldquo;{p.quote}&rdquo;</p>
                <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginTop: 2 }}>{p.context}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — plasma command */}
      <section style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)", padding: "100px 20px 80px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 48 }}>
            <div style={{ position: "absolute", inset: "-60px -80px", background: "radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
            <h2 className="display-xl" style={{ color: "#fff", position: "relative" }}>
              Everything around<br />the music.
            </h2>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,0.35)", marginBottom: 48 }}>
            So you can stay in the music.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Link href="/sign-in?mode=sign-up">
              <span style={{ display: "inline-block", padding: "16px 48px", borderRadius: 14, background: "linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(0,212,255,0.35) 100%)", border: "0.5px solid rgba(0,212,255,0.4)", fontSize: 16, fontWeight: 500, color: "#fff", boxShadow: "0 0 40px rgba(168,85,247,0.2), 0 4px 24px rgba(0,0,0,0.6)", cursor: "pointer", letterSpacing: "0.02em" }}>
                Start for free — no card needed
              </span>
            </Link>
            <WaitlistForm />
          </div>
          <p style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.12)", letterSpacing: "0.04em" }}>Free plan available. Built for independent artists. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)", padding: "24px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          <span>Pocket Manager · Your manager brain in your pocket · Built for independent artists</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/terms"><span style={{ color: "rgba(255,255,255,0.2)" }}>Terms</span></Link>
            <Link href="/privacy"><span style={{ color: "rgba(255,255,255,0.2)" }}>Privacy</span></Link>
            <Link href="/sign-in"><span style={{ color: "rgba(255,255,255,0.2)" }}>Sign in</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
