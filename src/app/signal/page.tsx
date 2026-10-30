"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getAuthHeaders } from "@/lib/supabase";
import type { SongCatalogItem } from "@/lib/backstage-data";

// ─── Real pipeline data ───────────────────────────────────────────────────────
// Signal reads the same persisted pitches the Pitching Engine writes
// (user_playlist_pitches via /api/v1/pitches) — curators the artist
// actually imported, with the pitch text and send state that were really
// saved. There is no built-in playlist pool: if the artist hasn't
// imported curators yet, this page says so and points at the import flow.

type PitchDbStatus = "queued" | "opened" | "sent" | "replied" | "placed" | "declined";

type SavedPitch = {
  id: string;
  songId: string;
  songTitle: string;
  playlistName: string;
  curatorName: string;
  curatorEmail: string;
  curatorHandle: string;
  platform: string;
  followers: string;
  genre: string;
  mood: string;
  fitScore: number | null;
  subject: string;
  body: string;
  status: PitchDbStatus;
  sentDate: string;
};

const STATUS_CONFIG: Record<PitchDbStatus, { label: string; color: string; bg: string; dot: string }> = {
  queued:   { label: "Queued",        color: "text-white/40",    bg: "bg-white/[0.06]",   dot: "bg-white/20" },
  opened:   { label: "Opened in mail", color: "text-[#ef9f27]",  bg: "bg-[#ef9f27]/10",   dot: "bg-[#ef9f27]" },
  sent:     { label: "Sent",          color: "text-white/50",    bg: "bg-white/[0.06]",   dot: "bg-white/40" },
  replied:  { label: "Replied",       color: "text-[#6c9fcf]",  bg: "bg-[#6c9fcf]/10",   dot: "bg-[#6c9fcf]" },
  placed:   { label: "Placed",        color: "text-[#97c459]",  bg: "bg-[#97c459]/10",   dot: "bg-[#97c459]" },
  declined: { label: "Declined",      color: "text-[#e24b4a]/80", bg: "bg-[#e24b4a]/[0.07]", dot: "bg-[#e24b4a]/60" },
};

const FILTER_TYPES = ["All", "Queued", "Opened in mail", "Sent", "Replied", "Placed", "Declined"] as const;

const FILTER_TO_STATUS: Record<string, PitchDbStatus | null> = {
  All: null,
  Queued: "queued",
  "Opened in mail": "opened",
  Sent: "sent",
  Replied: "replied",
  Placed: "placed",
  Declined: "declined",
};

const CAMPAIGN_OVERRIDE_CHECKLIST = [
  {
    title: "Ignore lazy defaults",
    detail:
      "Do not trust whatever the platform auto-selects. Pick the objective, placements, and optimization goal on purpose.",
  },
  {
    title: "Judge with 3 real numbers",
    detail:
      "Track hook rate, click-through rate, and cost per real action first. Everything else is secondary until those are healthy.",
  },
  {
    title: "Protect traffic quality",
    detail:
      "If clicks are cheap but low-intent, the campaign is lying to you. Watch saves, follows, replies, signups, and sales quality.",
  },
  {
    title: "Batch creative, not single shots",
    detail:
      "Launch multiple hooks and angles at once so the weak ideas die fast and the best ones get more budget.",
  },
] as const;

const CREATIVE_TEST_BATCHES = [
  {
    title: "Hook tests",
    summary: "Test the first 1–3 seconds before anything else.",
    assets: ["performance teaser", "studio moment", "quote/lyric opener"],
    metric: "Hold rate + outbound intent",
  },
  {
    title: "Proof tests",
    summary: "Swap social proof and receipts without changing the offer.",
    assets: ["fan reaction", "stream count", "behind-the-scenes proof"],
    metric: "Saves, shares, replies",
  },
  {
    title: "CTA tests",
    summary: "Keep the creative constant and test where the click is pointed.",
    assets: ["stream now", "join waitlist", "watch full video"],
    metric: "Cost per action",
  },
] as const;

const DECISION_RULES = [
  {
    label: "Kill",
    tone: "text-[#f05c5c]",
    bg: "bg-[#e24b4a]/10",
    rule: "Weak hook, weak click, or bad traffic after enough spend/impressions.",
  },
  {
    label: "Hold",
    tone: "text-[#ef9f27]",
    bg: "bg-[#ef9f27]/10",
    rule: "Signal is mixed. Let it breathe for one clean test window before touching it.",
  },
  {
    label: "Scale",
    tone: "text-[#97c459]",
    bg: "bg-[#97c459]/10",
    rule: "Strong hook + strong action quality. Add budget, duplicate winners, and keep the rest simple.",
  },
] as const;

const TRAFFIC_GUARDRAILS = [
  "Do not change targeting, copy, and creative at the same time.",
  "Let a test window finish before judging it early out of emotion.",
  "Broad with light constraints usually beats over-targeting.",
  "Name every test clearly so you can tell what actually won.",
] as const;

export default function SignalPage() {
  const { songs, profile } = usePocket();
  const [pitches, setPitches] = useState<SavedPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [persisted, setPersisted] = useState(true);
  const [songFilter, setSongFilter] = useState<string>("all");
  const [filter, setFilter] = useState<string>("All");
  const [expandedPitch, setExpandedPitch] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/v1/pitches", { headers });
        if (res.ok) {
          const data = (await res.json()) as { pitches?: SavedPitch[]; persisted?: boolean };
          setPitches(Array.isArray(data.pitches) ? data.pitches : []);
          setPersisted(data.persisted ?? false);
        } else {
          setPitches([]);
        }
      } catch {
        setPitches([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visiblePitches = useMemo(
    () => (songFilter === "all" ? pitches : pitches.filter((p) => p.songId === songFilter)),
    [pitches, songFilter],
  );

  const stats = useMemo(() => ({
    total: visiblePitches.length,
    queued: visiblePitches.filter((p) => p.status === "queued").length,
    // "Sent" only counts pitches that actually left the app — server-sent
    // or explicitly marked sent (and anything downstream of that).
    sent: visiblePitches.filter((p) => ["sent", "replied", "placed", "declined"].includes(p.status)).length,
    replied: visiblePitches.filter((p) => ["replied", "placed"].includes(p.status)).length,
    placed: visiblePitches.filter((p) => p.status === "placed").length,
    declined: visiblePitches.filter((p) => p.status === "declined").length,
  }), [visiblePitches]);

  const responseRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;
  const placementRate = stats.sent > 0 ? Math.round((stats.placed / stats.sent) * 100) : 0;

  const circumference = 2 * Math.PI * 48;
  const responseArc = (responseRate / 100) * circumference;
  const placementArc = (placementRate / 100) * circumference;

  const filteredPitches = useMemo(() => {
    const status = FILTER_TO_STATUS[filter];
    if (!status) return visiblePitches;
    return visiblePitches.filter((p) => p.status === status);
  }, [visiblePitches, filter]);

  const patchPitch = useCallback(async (pitch: SavedPitch, patch: Record<string, unknown>) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/v1/pitches", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: pitch.id, ...patch }),
      });
      if (res.ok) {
        const data = (await res.json()) as { pitch?: SavedPitch };
        if (data.pitch) {
          setPitches((prev) => prev.map((p) => (p.id === pitch.id ? data.pitch! : p)));
        }
      }
    } catch { /* state stays as-is on failure */ }
  }, []);

  const handleOpenInMail = useCallback((pitch: SavedPitch) => {
    // Opening the mail client is NOT a send — record it honestly as
    // "opened in mail" (the pitches API enforces the same distinction).
    if (pitch.status === "queued") {
      void patchPitch(pitch, { sendState: "opened-in-mail" });
    }
  }, [patchPitch]);

  function pitchText(pitch: SavedPitch, song?: SongCatalogItem): string {
    if (pitch.body) return pitch.subject ? `Subject: ${pitch.subject}\n\n${pitch.body}` : pitch.body;
    const artistName = profile.artistName ?? "the artist";
    const curator = pitch.curatorName || pitch.curatorHandle || "there";
    const lines = [
      `Subject: ${artistName} — "${pitch.songTitle}" for ${pitch.playlistName}`,
      "",
      `Hi ${curator},`,
      "",
      `I'm reaching out about "${pitch.songTitle}" by ${artistName}${pitch.genre ? ` — a ${pitch.genre} record` : ""} that I think fits ${pitch.playlistName} really well.`,
      "",
      ...(song ? [
        `The track runs ${song.bpm ? `${song.bpm} BPM` : "a mid-tempo pace"}, key of ${song.musicalKey ?? "Dm"}${song.mood ? `, with a ${song.mood} feel` : ""}. It's been out since ${song.releaseDate ?? "recently"} and is available on all major platforms.`,
        "",
        `ISRC: ${song.isrc ?? "on request"}`,
      ] : []),
      "",
      `I'd love for you to consider it for the playlist. Happy to send any additional assets — cover art, stem files, or a one-sheet.`,
      "",
      `Thanks for listening,`,
      `${artistName}`,
    ];
    return lines.join("\n");
  }

  const hasPitches = pitches.length > 0;

  return (
    <AppShell title="Signal" eyebrow="Get heard">
      <main className="mx-auto max-w-4xl space-y-4 text-white/90">

        {/* Hero */}
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Signal</div>
          <h2 className="mt-3 text-[32px] font-light leading-none tracking-[-0.03em]">Pitch score</h2>
          <p className="mt-2 text-sm text-white/35">
            {loading
              ? "Loading your real pitch pipeline…"
              : hasPitches
                ? `Tracking ${pitches.length} real ${pitches.length === 1 ? "pitch" : "pitches"} from your curator imports`
                : "No curator pitches yet — your real pipeline appears here once you import"}
          </p>

          {/* Score meters */}
          <div className="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-4">
            <div className="col-span-1 flex flex-col items-center">
              <div className="relative size-24">
                <svg viewBox="0 0 112 112" className="absolute inset-0 size-full">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#ef9f27" strokeWidth="7"
                    strokeDasharray={`${responseArc} ${circumference}`}
                    strokeLinecap="round" transform="rotate(-90 56 56)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[22px] font-light text-white">{responseRate}%</div>
                  <div className="text-[9px] text-white/30">responded</div>
                </div>
              </div>
            </div>

            <div className="col-span-1 flex flex-col items-center">
              <div className="relative size-24">
                <svg viewBox="0 0 112 112" className="absolute inset-0 size-full">
                  <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
                  <circle cx="56" cy="56" r="48" fill="none" stroke="#97c459" strokeWidth="7"
                    strokeDasharray={`${placementArc} ${circumference}`}
                    strokeLinecap="round" transform="rotate(-90 56 56)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[22px] font-light text-white">{placementRate}%</div>
                  <div className="text-[9px] text-white/30">placed</div>
                </div>
              </div>
            </div>

            <div className="col-span-1 flex flex-col justify-center gap-2 sm:col-span-2">
              {[
                { label: "Total pitches", value: stats.total, dot: "bg-white/20" },
                { label: "Queued", value: stats.queued, dot: "bg-white/30" },
                { label: "Sent", value: stats.sent, dot: "bg-white/50" },
                { label: "Replied", value: stats.replied, dot: "bg-[#6c9fcf]" },
                { label: "Placed", value: stats.placed, dot: "bg-[#97c459]" },
                { label: "Declined", value: stats.declined, dot: "bg-[#e24b4a]/60" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className={`size-1.5 shrink-0 rounded-full ${s.dot}`} />
                  <span className="flex-1 text-[12px] text-white/40">{s.label}</span>
                  <span className="text-[12px] font-medium text-white/70">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline source */}
        <section className="rounded-[24px] glass card-shadow px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Your curator pipeline</div>
          <p className="mt-2 text-sm text-white/50">
            Everything here comes from the curator list you imported into the Pitching Engine — real playlists,
            real contacts, real send history. Nothing is estimated or pre-filled.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={songFilter}
              onChange={(e) => setSongFilter(e.target.value)}
              className="h-10 flex-1 rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
            >
              <option value="all">All songs</option>
              {songs.map((s) => (
                <option key={s.id} value={s.id}>{s.title} {s.genre ? `· ${s.genre}` : ""}</option>
              ))}
            </select>
            <Link
              href="/pitching"
              className="rounded-lg bg-[#0d0d0b] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#242424]"
            >
              Open Pitching Engine →
            </Link>
          </div>
          {!persisted && !loading && (
            <p className="mt-3 text-[12px] text-[#ef9f27]">
              Pitch storage isn&apos;t set up on this account yet — pitches you generate in the Pitching Engine
              won&apos;t appear here until the database migration runs.
            </p>
          )}
        </section>

        <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] glass card-shadow px-5 py-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Testing OS</div>
            <div className="space-y-3">
              {CREATIVE_TEST_BATCHES.map((batch) => (
                <div key={batch.title} className="rounded-[16px] border-[0.5px] border-white/8 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[14px] font-medium text-white/90">{batch.title}</div>
                    <span className="rounded-full border-[0.5px] border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
                      {batch.metric}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-white/50">{batch.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {batch.assets.map((asset) => (
                      <span key={asset} className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] text-white/55">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <section className="rounded-[24px] glass card-shadow px-5 py-5">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Decision rules</div>
              <div className="space-y-2">
                {DECISION_RULES.map((item) => (
                  <div key={item.label} className={`rounded-[16px] px-4 py-3 ${item.bg}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${item.tone}`}>{item.label}</div>
                    <p className="mt-1.5 text-[13px] leading-5 text-white/60">{item.rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] glass card-shadow px-5 py-5">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Default override checklist</div>
              <div className="space-y-3">
                {CAMPAIGN_OVERRIDE_CHECKLIST.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-[#ef9f27]" />
                    <div>
                      <div className="text-[13px] font-medium text-white/85">{item.title}</div>
                      <p className="mt-1 text-[12px] leading-5 text-white/50">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[16px] border-[0.5px] border-white/8 bg-black/10 px-4 py-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Guardrails</div>
                <div className="mt-2 space-y-2 text-[12px] leading-5 text-white/55">
                  {TRAFFIC_GUARDRAILS.map((rule) => (
                    <div key={rule}>• {rule}</div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>

        {/* Pitch tracker */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Pitch tracker</div>
            <div className="text-[11px] text-white/50">Your imported curators and what actually happened</div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {FILTER_TYPES.map((t) => {
              const status = FILTER_TO_STATUS[t];
              const count = !status ? visiblePitches.length : visiblePitches.filter((p) => p.status === status).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                    filter === t
                      ? "bg-[#0d0d0b] text-white"
                      : "border-[0.5px] border-white/10 bg-white/5 text-white/50"
                  }`}
                >
                  {t}
                  {count > 0 && <span className="text-[10px] text-white/50">{count}</span>}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="rounded-xl border-[0.5px] border-dashed border-white/10 glass p-8 text-center text-sm text-white/50">
              Loading your pitches…
            </div>
          ) : filteredPitches.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-dashed border-white/10 glass p-8 text-center">
              <div className="text-sm font-medium text-white/90">
                {visiblePitches.length === 0 ? "Import your curator list to see real playlists" : "No pitches match this filter"}
              </div>
              <p className="mt-1 text-xs text-white/50">
                {visiblePitches.length === 0
                  ? "Signal tracks the curators you bring in — import a curator CSV in the Pitching Engine and generate pitches, and they show up here with their real status."
                  : "Try a different filter."}
              </p>
              {visiblePitches.length === 0 && (
                <Link href="/pitching" className="mt-4 inline-block rounded-lg bg-[#0d0d0b] px-4 py-2 text-xs font-medium text-white">
                  Import curators →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPitches.map((pitch) => {
                const cfg = STATUS_CONFIG[pitch.status];
                const song = songs.find((s) => s.id === pitch.songId);
                const isExpanded = expandedPitch === pitch.id;
                const text = pitchText(pitch, song);
                return (
                  <div key={pitch.id} className="overflow-hidden rounded-[14px] border-[0.5px] border-white/8 bg-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => setExpandedPitch(isExpanded ? null : pitch.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left"
                    >
                      <div className={`mt-1 size-2 shrink-0 rounded-full ${cfg.dot}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-white/90">{pitch.playlistName}</span>
                          {pitch.platform && <span className="text-[11px] text-white/50">{pitch.platform}</span>}
                          {pitch.followers && <span className="text-[11px] text-white/50">{pitch.followers}</span>}
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/50">
                          &ldquo;{pitch.songTitle}&rdquo;
                          {pitch.genre ? ` · ${pitch.genre}` : ""}
                          {pitch.fitScore !== null ? ` · ${pitch.fitScore}% fit` : ""}
                          {pitch.sentDate ? ` · Sent ${pitch.sentDate}` : ""}
                        </div>
                        {(pitch.curatorName || pitch.curatorHandle || pitch.curatorEmail) && (
                          <div className="mt-0.5 text-[11px] text-white/35">
                            {[pitch.curatorName, pitch.curatorHandle, pitch.curatorEmail].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/8 bg-white/5 px-4 py-4 space-y-3">
                        <div>
                          <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">Pitch</div>
                          <pre className="whitespace-pre-wrap rounded-lg border-[0.5px] border-white/8 bg-white/5 p-3 text-[12px] leading-5 text-white/60">
                            {text}
                          </pre>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pitch.curatorEmail ? (
                            <a
                              href={`mailto:${encodeURIComponent(pitch.curatorEmail)}?subject=${encodeURIComponent(pitch.subject || `${profile.artistName ?? "Artist"} — "${pitch.songTitle}" for ${pitch.playlistName}`)}&body=${encodeURIComponent(text)}`}
                              onClick={() => handleOpenInMail(pitch)}
                              className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-white/90"
                            >
                              Open in Mail →
                            </a>
                          ) : (
                            <span className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-white/35">
                              No contact email on this curator — add it in the Pitching Engine
                            </span>
                          )}
                          {(pitch.status === "queued" || pitch.status === "opened") && (
                            <button
                              type="button"
                              onClick={() => void patchPitch(pitch, { sendState: "sent" })}
                              className="rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white"
                            >
                              Mark as sent
                            </button>
                          )}
                          {pitch.status === "sent" && (
                            <>
                              <button type="button" onClick={() => void patchPitch(pitch, { trackingStatus: "replied" })} className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-white/90">Mark replied</button>
                              <button type="button" onClick={() => void patchPitch(pitch, { trackingStatus: "placed" })} className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-[#97c459]">Mark placed</button>
                              <button type="button" onClick={() => void patchPitch(pitch, { trackingStatus: "declined" })} className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-white/50">Mark declined</button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={async () => { await navigator.clipboard.writeText(text); }}
                            className="rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-xs text-white/50"
                          >
                            Copy pitch
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="rounded-[24px] glass card-shadow px-5 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 size-8 shrink-0 rounded-full bg-[#ef9f27]/10 text-center text-[16px] leading-8">⚡</div>
            <div>
              <div className="text-sm font-medium text-white/90">How pitch tracking works</div>
              <p className="mt-1 text-[13px] leading-5 text-white/50">
                Signal mirrors your Pitching Engine history. &ldquo;Open in Mail&rdquo; launches your email app with the
                pitch pre-written to the curator&apos;s real address, and records only that the mail client opened —
                a pitch counts as <em>sent</em> when the server delivers it or you mark it sent. When a curator
                responds, update the status here and it stays in sync everywhere.
              </p>
            </div>
          </div>
          <div className="border-t border-white/8 pt-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50 mb-2">Find real curator contacts</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "SubmitHub", href: "https://www.submithub.com", hint: "Pay-per-pitch, guaranteed feedback" },
                { label: "Groover", href: "https://groover.co", hint: "European curators, €2/contact" },
                { label: "Playlist Supply", href: "https://playlistsupply.com", hint: "Spotify playlist curator database" },
              ].map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col rounded-xl border-[0.5px] border-white/8 bg-white/5 px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <span className="text-[12px] font-medium text-white/90">{r.label} →</span>
                  <span className="text-[10px] text-white/50">{r.hint}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Signal tools */}
        <section className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/pitching", title: "Pitching engine", body: "Import thousands of curator contacts, generate AI-personalized pitches, and send at scale." },
            { href: "/pitch-kits", title: "Pitch kit builder", body: "Build a targeted outreach package for labels, sync, radio, and venues." },
            { href: "/epk", title: "Electronic press kit", body: "Living page for curators, labels, booking, and partners." },
            { href: "/career-twin", title: "Career twin", body: "See which artists were at your exact stage 2–3 years ago and what move broke them through." },
          ].map((area) => (
            <Link key={area.href} href={area.href} className="rounded-[20px] glass card-shadow p-5 press">
              <div className="text-[14px] font-medium text-white/90">{area.title}</div>
              <p className="mt-1.5 text-sm leading-6 text-white/50">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
