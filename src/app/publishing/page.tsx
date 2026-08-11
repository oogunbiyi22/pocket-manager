"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProAffiliation = "ASCAP" | "BMI" | "SESAC" | "SOCAN" | "PRS" | "Other" | "";

type PublishingProfile = {
  companyName: string;
  proAffiliation: ProAffiliation;
  ipiNumber: string;          // PRO member/IPI/CAE number
  publishingAdmin: string;    // Songtrust, DistroKid Publishing, self, etc.
  setupComplete: boolean;
};

type SongPublishingStatus = {
  songId: string;
  title: string;
  registered: boolean;
  ipiVerified: boolean;
  splitDeclared: boolean;
  mechanicalClaimed: boolean;
};

const STORAGE_KEY = "pocket-manager-publishing-v1";
const PROS = ["ASCAP", "BMI", "SESAC", "SOCAN", "PRS", "Other"] as const;
const ADMINS = ["Self (Direct)", "Songtrust", "DistroKid Publishing", "CD Baby Pro", "TuneCore Publishing", "Other"];

function loadPublishing(): PublishingProfile {
  if (typeof window === "undefined") return { companyName: "", proAffiliation: "", ipiNumber: "", publishingAdmin: "", setupComplete: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PublishingProfile) : { companyName: "", proAffiliation: "", ipiNumber: "", publishingAdmin: "", setupComplete: false };
  } catch { return { companyName: "", proAffiliation: "", ipiNumber: "", publishingAdmin: "", setupComplete: false }; }
}

function savePublishing(p: PublishingProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ─── Readiness score ──────────────────────────────────────────────────────────

function getPublishingScore(pub: PublishingProfile, songs: SongPublishingStatus[]): number {
  let score = 0;
  if (pub.companyName) score += 20;
  if (pub.proAffiliation) score += 20;
  if (pub.ipiNumber) score += 20;
  if (pub.publishingAdmin) score += 10;
  const registered = songs.filter((s) => s.registered).length;
  if (songs.length > 0) score += Math.round((registered / songs.length) * 30);
  return Math.min(score, 100);
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{label}</div>;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`} transform="rotate(-90 34 34)" />
      <text x="34" y="34" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="500" fill={color}>{score}</text>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublishingPage() {
  const { songs, profile } = usePocket();
  const [pub, setPub] = useState<PublishingProfile>(() => loadPublishing());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PublishingProfile>(() => loadPublishing());
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const songStatuses: SongPublishingStatus[] = songs.map((s) => ({
    songId: s.id,
    title: s.title,
    registered: Boolean(s.isrc) && Boolean(pub.proAffiliation),
    ipiVerified: Boolean(pub.ipiNumber),
    splitDeclared: (s.collaborators?.length ?? 0) > 0,
    mechanicalClaimed: Boolean(s.isrc),
  }));

  const score = getPublishingScore(pub, songStatuses);
  const registeredCount = songStatuses.filter((s) => s.registered).length;
  const unregisteredCount = songStatuses.length - registeredCount;

  function handleSave() {
    const updated = { ...form, setupComplete: Boolean(form.companyName && form.proAffiliation && form.ipiNumber) };
    setPub(updated);
    savePublishing(updated);
    setEditing(false);
  }

  async function loadAiInsight() {
    if (!songs.length) return;
    setLoadingAi(true);
    try {
      const catalogSummary = songs.map((s) => `"${s.title}" (ISRC: ${s.isrc ?? "missing"}, splits: ${s.collaborators?.length ?? 0} writers)`).join("; ");
      const prompt = `Artist "${profile.artistName ?? "Artist"}" is reviewing their publishing setup.
Publishing company: "${pub.companyName || "not set up"}"
PRO: ${pub.proAffiliation || "not registered"}
IPI: ${pub.ipiNumber ? "registered" : "missing"}
Admin publisher: ${pub.publishingAdmin || "none"}
Catalog: ${catalogSummary}

In 3 bullet points, give the most important publishing actions this artist should take right now to start collecting composition royalties they are currently missing. Be specific and direct. Format as plain bullet points.`;

      const res = await fetch("/api/v1/manager/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          artistName: profile.artistName ?? "Artist",
          songs,
          plan: profile.plan ?? "free",
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      setAiInsight(text.trim());
    } catch {
      setAiInsight("Could not load publishing analysis. Try again.");
    } finally {
      setLoadingAi(false);
    }
  }

  useEffect(() => {
    if (pub.setupComplete || pub.proAffiliation) void loadAiInsight();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title="Publishing" eyebrow="Harvest">
      <main className="mx-auto max-w-3xl space-y-4 pb-16">
        {/* Hero */}
        <section className="overflow-hidden rounded-[24px] bg-[#0a0a0a] px-6 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Your Publishing Company</div>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[32px] font-light leading-none tracking-[-0.03em]">
                {pub.companyName || `${profile.artistName ?? "Your Name"} Publishing`}
              </h2>
              <p className="mt-2 text-sm text-white/40">
                {pub.proAffiliation
                  ? `Affiliated with ${pub.proAffiliation}${pub.ipiNumber ? ` · IPI ${pub.ipiNumber}` : ""}`
                  : "Not registered — composition royalties are being left uncollected"}
              </p>
            </div>
            <ScoreRing score={score} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[22px] font-light text-white">{songs.length}</div>
              <div className="mt-0.5 text-[11px] text-white/40">songs in catalog</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[22px] font-light text-[#97c459]">{registeredCount}</div>
              <div className="mt-0.5 text-[11px] text-white/40">PRO-eligible</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-[22px] font-light text-[#e24b4a]">{unregisteredCount}</div>
              <div className="mt-0.5 text-[11px] text-white/40">unregistered</div>
            </div>
          </div>

          <button
            onClick={() => { setForm(pub); setEditing(true); }}
            className="mt-5 rounded-lg btn-electric px-4 py-2"
          >
            {pub.setupComplete ? "Edit publishing setup" : "Set up publishing company →"}
          </button>
        </section>

        {/* Setup modal */}
        {editing && (
          <div className="rounded-[20px] glass p-5 space-y-4">
            <div className="text-[15px] font-medium text-white/90">Publishing Setup</div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-1">Publishing Company Name</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder={`${profile.artistName ?? "Your Name"} Music Publishing`}
                className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white/90 outline-none focus:border-[#7c6fef]/50"
              />
              <p className="mt-1 text-[11px] text-white/50">Register this name with your PRO as your publishing entity.</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-1">PRO Affiliation</label>
              <div className="flex flex-wrap gap-2">
                {PROS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, proAffiliation: p as ProAffiliation }))}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                      form.proAffiliation === p
                        ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                        : "border-white/10 text-white/40 hover:border-white/15"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-1">IPI / CAE / Member Number</label>
              <input
                value={form.ipiNumber}
                onChange={(e) => setForm((f) => ({ ...f, ipiNumber: e.target.value }))}
                placeholder="e.g. 00123456789"
                className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm font-mono text-white/90 outline-none focus:border-[#7c6fef]/50"
              />
              <p className="mt-1 text-[11px] text-white/50">Find this in your PRO account dashboard. Required to collect composition royalties.</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-[0.18em] text-white/40 mb-1">Publishing Administrator</label>
              <select
                value={form.publishingAdmin}
                onChange={(e) => setForm((f) => ({ ...f, publishingAdmin: e.target.value }))}
                className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-white/90 outline-none focus:border-[#7c6fef]/50 bg-white/[0.06]"
              >
                <option value="">Select administrator</option>
                {ADMINS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="flex-1 rounded-lg bg-[#0a0a0a] py-2.5 text-sm font-medium text-white">
                Save publishing setup ✓
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/40">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PRO Quick links */}
        {!pub.proAffiliation && (
          <section className="rounded-[20px] glass p-5">
            <SectionHead label="Register with a PRO" />
            <p className="mb-4 text-sm text-white/60 leading-6">
              Performance Rights Organizations collect composition royalties from radio, streaming, TV, and live shows. You must register to collect.
            </p>
            <div className="space-y-2">
              {[
                { name: "ASCAP", url: "https://www.ascap.com/music-creators/join", note: "Free to join, pays quarterly" },
                { name: "BMI", url: "https://www.bmi.com/creators/register", note: "Free to join, pays quarterly" },
                { name: "SESAC", url: "https://www.sesac.com/music-creators", note: "Invite-only, strong for gospel/Christian/country" },
                { name: "Songtrust", url: "https://songtrust.com", note: "Admin publisher, covers 245+ territories globally ($100 one-time)" },
              ].map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3 text-sm hover:bg-white/8 transition"
                >
                  <div>
                    <div className="font-medium text-white/90">{p.name}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{p.note}</div>
                  </div>
                  <span className="text-white/50">→</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Catalog registration */}
        {songs.length > 0 && (
          <section className="rounded-[20px] glass p-5">
            <SectionHead label="Catalog Registration Status" />
            <div className="space-y-2">
              {songStatuses.map((s) => (
                <div key={s.songId} className="flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3">
                  <div>
                    <div className="text-[14px] font-medium text-white/90">{s.title}</div>
                    <div className="mt-0.5 flex gap-3 text-[11px] text-white/50">
                      <span className={s.mechanicalClaimed ? "text-[#97c459]" : "text-[#e24b4a]"}>
                        ISRC {s.mechanicalClaimed ? "✓" : "missing"}
                      </span>
                      <span className={s.splitDeclared ? "text-[#97c459]" : "text-white/50"}>
                        Splits {s.splitDeclared ? "✓" : "not declared"}
                      </span>
                      <span className={s.ipiVerified ? "text-[#97c459]" : "text-white/50"}>
                        IPI {s.ipiVerified ? "✓" : "missing"}
                      </span>
                    </div>
                  </div>
                  <Link href={`/projects/${s.songId}`} className="text-[11px] font-medium text-[#ef9f27] hover:underline">
                    Fix →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI insight */}
        <section className="rounded-[20px] glass p-5">
          <SectionHead label="Publishing Intelligence" />
          {loadingAi && <p className="text-sm text-white/50">Analyzing your publishing gaps…</p>}
          {aiInsight && !loadingAi && (
            <div className="text-[14px] leading-7 text-white/60 whitespace-pre-wrap">{aiInsight}</div>
          )}
          {!loadingAi && !aiInsight && (
            <div className="space-y-3">
              <p className="text-sm text-white/60 leading-6">
                Complete your publishing setup to get AI analysis of your specific royalty gaps.
              </p>
              <button onClick={loadAiInsight} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                Analyze my publishing gaps
              </button>
            </div>
          )}
        </section>

        {/* Education */}
        <section className="rounded-[20px] glass p-5">
          <SectionHead label="Publishing 101" />
          <div className="space-y-3">
            {[
              { title: "Master vs. Composition", body: "Every song has two copyrights: the master recording (who paid for recording) and the composition (writers and publishers). Most artists only collect master royalties — composition royalties go uncollected without a PRO registration." },
              { title: "Mechanical Royalties", body: "Every stream, download, and physical sale generates mechanical royalties owed to the songwriter. The MLC (US) administers these for streaming. Register your works or use an admin publisher to collect." },
              { title: "What Songtrust does", body: "Songtrust acts as your publishing administrator — they register your songs with PROs in 245+ territories globally and collect royalties you'd otherwise miss. Worth $100/year if you're releasing internationally." },
            ].map((item) => (
              <details key={item.title} className="group rounded-xl border border-white/[0.06] px-4 py-3">
                <summary className="cursor-pointer text-[14px] font-medium text-white/90 list-none flex items-center justify-between">
                  {item.title}
                  <span className="text-white/50 transition group-open:rotate-90">›</span>
                </summary>
                <p className="mt-2 text-[13px] leading-6 text-white/60">{item.body}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
