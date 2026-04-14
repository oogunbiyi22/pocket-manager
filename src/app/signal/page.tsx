"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

type PitchStatus = "Sent" | "Opened" | "Replied" | "Placed" | "Declined";

type Pitch = {
  id: string;
  target: string;
  type: "Playlist" | "Blog" | "Sync" | "Label" | "Radio";
  platform: string;
  song: string;
  status: PitchStatus;
  sentDate: string;
  followers?: string;
  fitScore?: number;
};

const SEED_PITCHES: Pitch[] = [
  { id: "p1", target: "Late Night R&B", type: "Playlist", platform: "Spotify", song: "Late Nights", status: "Opened", sentDate: "Apr 10", followers: "284K", fitScore: 94 },
  { id: "p2", target: "After Hours Vibes", type: "Playlist", platform: "Apple Music", song: "Late Nights", status: "Sent", sentDate: "Apr 11", followers: "91K", fitScore: 89 },
  { id: "p3", target: "Bedroom Soul", type: "Playlist", platform: "Spotify", song: "Late Nights", status: "Sent", sentDate: "Apr 12", followers: "67K", fitScore: 86 },
  { id: "p4", target: "Indie R&B Review", type: "Blog", platform: "Web", song: "Neon Heart", status: "Replied", sentDate: "Apr 9", fitScore: 78 },
  { id: "p5", target: "College Radio Network", type: "Radio", platform: "FM/Web", song: "Late Nights", status: "Sent", sentDate: "Apr 8" },
];

type SyncBrief = {
  id: string;
  title: string;
  mediaType: string;
  mood: string;
  bpmRange: string;
  deadline: string;
  fee: string;
  exclusive: boolean;
};

const SYNC_BRIEFS: SyncBrief[] = [
  { id: "s1", title: "Luxury Auto Brand Spot", mediaType: "TV / Digital Ad", mood: "Late-night, aspirational", bpmRange: "80–100", deadline: "Apr 20", fee: "$1,500–5,000", exclusive: false },
  { id: "s2", title: "Drama Series — End Card", mediaType: "Streaming Series", mood: "Emotional, introspective", bpmRange: "60–90", deadline: "May 2", fee: "$3,000+", exclusive: true },
  { id: "s3", title: "Lifestyle Brand Campaign", mediaType: "Social / Display", mood: "Smooth, urban", bpmRange: "90–110", deadline: "Apr 28", fee: "$800–2,000", exclusive: false },
];

const STATUS_CLASS: Record<PitchStatus, string> = {
  Sent: "bg-white text-[#6b6b65] border border-black/10",
  Opened: "bg-[#faeeda] text-[#854f0b]",
  Replied: "bg-[#edf5ff] text-[#2c5b9e]",
  Placed: "bg-[#eaf3de] text-[#3b6d11]",
  Declined: "bg-[#fcebeb] text-[#a32d2d]",
};

const PITCH_TYPES = ["All", "Playlist", "Blog", "Sync", "Label", "Radio"] as const;

export default function SignalPage() {
  const { songs, profile } = usePocket();
  const activeSong = songs[0];
  const totalStreams = songs.reduce((t, s) => t + s.streams, 0);
  const monthlyStreams = Math.round(totalStreams / 12);

  const [filter, setFilter] = useState<string>("All");
  const [pitches, setPitches] = useState<Pitch[]>(SEED_PITCHES);

  const filtered = filter === "All" ? pitches : pitches.filter((p) => p.type === filter);

  const sent = pitches.filter((p) => p.status !== "Declined").length;
  const opened = pitches.filter((p) => ["Opened", "Replied", "Placed"].includes(p.status)).length;
  const placed = pitches.filter((p) => p.status === "Placed").length;

  function updateStatus(id: string, status: PitchStatus) {
    setPitches((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  return (
    <AppShell title="Signal" eyebrow="Get heard">
      <main className="mx-auto max-w-4xl space-y-4 text-[#111]">

        {/* Command surface */}
        <section className="overflow-hidden rounded-[24px] glass-dark card-shadow-dark px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Signal</div>
          <div className="mt-3 flex items-end gap-6">
            <div>
              <div className="text-[40px] font-light leading-none tracking-[-0.04em]">{sent}</div>
              <div className="mt-1 text-xs text-white/35">pitches sent</div>
            </div>
            <div className="pb-1">
              <div className="text-[24px] font-light text-[#ef9f27]">{opened}</div>
              <div className="text-xs text-white/35">opened</div>
            </div>
            <div className="pb-1">
              <div className="text-[24px] font-light text-[#97c459]">{placed}</div>
              <div className="text-xs text-white/35">placed</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/35">
            {activeSong ? `"${activeSong.title}" is your active record` : "Add a song to start pitching"}
          </p>
        </section>

        {/* Quick pitch CTA */}
        <section className="rounded-[24px] glass card-shadow px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[15px] font-medium text-[#111]">
                Pitch {activeSong ? `"${activeSong.title}"` : "a song"}
              </div>
              <div className="mt-1 text-sm text-[#6b6b65]">94 matching playlists · 3 sync briefs open</div>
            </div>
            <Link
              href="/pitch-kits"
              className="shrink-0 rounded-lg bg-[#0d0d0b] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#242424]"
            >
              Build pitch →
            </Link>
          </div>
        </section>

        {/* Pitch tracker */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Pitch tracker</div>
            <Link href="/pitch-kits" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#854f0b]">
              New pitch →
            </Link>
          </div>

          {/* Filter chips */}
          <div className="mb-3 flex flex-wrap gap-2">
            {PITCH_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                  filter === t
                    ? "bg-[#0d0d0b] text-white"
                    : "border-[0.5px] border-black/15 bg-white text-[#6b6b65]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((pitch) => (
              <div
                key={pitch.id}
                className="overflow-hidden rounded-[14px] glass-subtle"
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-normal text-[#111]">{pitch.target}</span>
                      <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] text-[#6b6b65]">{pitch.type}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9a9a8a]">
                      {pitch.platform} · "{pitch.song}" · {pitch.sentDate}
                      {pitch.followers ? ` · ${pitch.followers} followers` : ""}
                      {pitch.fitScore ? ` · ${pitch.fitScore}% fit` : ""}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${STATUS_CLASS[pitch.status]}`}>
                    {pitch.status}
                  </span>
                </div>
                {/* Status update strip */}
                <div className="flex gap-1.5 border-t border-black/[0.06] px-4 py-2">
                  {(["Opened", "Replied", "Placed", "Declined"] as PitchStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateStatus(pitch.id, s)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] transition ${
                        pitch.status === s
                          ? "bg-[#0d0d0b] text-white"
                          : "border-[0.5px] border-black/10 text-[#9a9a8a] hover:bg-[#f5f4f0]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sync briefs */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Sync briefs</div>
            <Link href="/sync" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#854f0b]">
              All briefs →
            </Link>
          </div>
          <div className="space-y-2">
            {SYNC_BRIEFS.map((brief) => (
              <div key={brief.id} className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-normal text-[#111]">{brief.title}</div>
                      <div className="mt-0.5 text-[11px] text-[#9a9a8a]">
                        {brief.mediaType} · {brief.mood} · BPM {brief.bpmRange}
                      </div>
                    </div>
                    {brief.exclusive && (
                      <span className="shrink-0 rounded-full bg-[#0d0d0b] px-2 py-0.5 text-[10px] text-white/70">
                        Exclusive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-[#6b6b65]">
                    <span>Deadline: {brief.deadline}</span>
                    <span className="font-medium text-[#3b6d11]">{brief.fee}</span>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-black/[0.06] px-4 py-2">
                  <Link
                    href="/pitch-kits"
                    className="rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Pitch →
                  </Link>
                  <Link
                    href="/epk"
                    className="rounded-lg border-[0.5px] border-black/15 px-3 py-1.5 text-xs text-[#6b6b65]"
                  >
                    EPK link
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EPK card */}
        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">EPK</div>
          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
            <div className="bg-[#0d0d0b] px-5 py-5 text-white">
              <div className="text-[18px] font-light tracking-tight">{profile.artistName ?? "Artist"}</div>
              <div className="mt-1 text-sm text-white/45">{profile.vibe || profile.role || "Independent artist"}</div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {[
                  { label: "Streams", value: `${(totalStreams / 1000).toFixed(0)}K` },
                  { label: "Monthly", value: `${(monthlyStreams / 1000).toFixed(1)}K` },
                  { label: "Releases", value: String(songs.length) },
                  { label: "Playlists", value: "3" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">{stat.label}</div>
                    <div className="mt-1 text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <p className="text-sm text-[#6b6b65]">Share with curators, labels, and sync.</p>
              <Link href="/epk" className="shrink-0 rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111] transition hover:bg-[#f5f4f0]">
                Share EPK →
              </Link>
            </div>
          </div>
        </section>

        {/* Signal tools */}
        <section className="py-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/pitch-kits", title: "Pitch kit builder", body: "Turn metadata into a focused pitch for any target." },
              { href: "/studio", title: "Promo Studio", body: "Draft release assets for social, email, and curator pitches." },
            ].map((area) => (
              <Link key={area.href} href={area.href}
                className="rounded-[20px] glass card-shadow p-5 press">
                <div className="text-[14px] font-medium text-[#111]">{area.title}</div>
                <p className="mt-1.5 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
