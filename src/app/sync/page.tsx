"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const opportunities = [
  {
    id: "lofi-series",
    title: "Lo-fi R&B cue for streaming drama",
    media: "TV series",
    genre: "R&B",
    mood: "Late night",
    bpmMin: 70,
    bpmMax: 105,
    deadline: "2026-06-15",
    budget: "$1,000-$3,000",
  },
  {
    id: "club-ad",
    title: "High-energy club track for footwear ad",
    media: "Ad",
    genre: "Dance",
    mood: "Bright",
    bpmMin: 118,
    bpmMax: 132,
    deadline: "2026-05-30",
    budget: "$2,500-$7,500",
  },
  {
    id: "night-drive-game",
    title: "Night-drive instrumental for racing game menu",
    media: "Game",
    genre: "Electronic",
    mood: "Late night",
    bpmMin: 80,
    bpmMax: 115,
    deadline: "2026-07-01",
    budget: "$750-$2,000",
  },
];

export default function SyncPage() {
  const { songs } = usePocket();
  const matches = opportunities.flatMap((opportunity) =>
    songs
      .map((song) => ({
        opportunity,
        song,
        score: getMatchScore(song.genre, song.mood, song.bpm, opportunity),
      }))
      .filter((match) => match.score > 0),
  ).sort((left, right) => right.score - left.score);

  return (
    <AppShell title="Sync Matches" eyebrow="Phase 11 preview">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Sync opportunity alerts</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Match the catalog to briefs without creating a marketplace.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            This preview uses local sample briefs and metadata matching. Real brief sourcing, supervisor feeds, and submission workflows come later.
          </p>
        </section>

        <section className="mt-5 space-y-3">
          {matches.length ? (
            matches.map(({ opportunity, score, song }) => (
              <article key={`${opportunity.id}-${song.id}`} className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">{opportunity.media}</div>
                    <h3 className="mt-2 text-xl font-normal text-[#111]">{opportunity.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#514d47]">
                      {song.title} matches by {song.genre ?? "genre needed"} / {song.mood ?? "mood needed"} / {song.bpm ?? "BPM needed"} BPM.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#e6f1fb] px-3 py-1 text-[11px] font-medium text-[#185fa5]">{score}% match</span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Fact label="Deadline" value={opportunity.deadline} />
                  <Fact label="Budget" value={opportunity.budget} />
                  <Fact label="Brief BPM" value={`${opportunity.bpmMin}-${opportunity.bpmMax}`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/projects/${song.id}`} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white">
                    Open song
                  </Link>
                  <Link href="/pitch-kits" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111]">
                    Build pitch
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border-[0.5px] border-dashed border-black/20 bg-[#f8f6f1] p-4 text-sm text-[#6b6b65]">
              No sample sync matches. Add genre, mood, and BPM metadata to improve matching.
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function getMatchScore(genre: string | undefined, mood: string | undefined, bpm: number | undefined, opportunity: (typeof opportunities)[number]) {
  let score = 0;

  if (genre && genre.toLowerCase() === opportunity.genre.toLowerCase()) score += 45;
  if (mood && mood.toLowerCase() === opportunity.mood.toLowerCase()) score += 35;
  if (bpm && bpm >= opportunity.bpmMin && bpm <= opportunity.bpmMax) score += 20;

  return score;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-[0.5px] border-black/10 bg-white px-3 py-3 text-sm">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#6b6b65]">{label}</div>
      <div className="mt-1 text-[#111]">{value}</div>
    </div>
  );
}
