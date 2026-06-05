"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  formatGapEstimate,
  getSongEstimatedGap,
  getSongGapScore,
  getSongReadinessScore,
  type SongCatalogItem,
} from "@/lib/backstage-data";

function ReadinessRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#97c459" : score >= 40 ? "#ef9f27" : "#e24b4a";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="500" fill={color}>
        {score}
      </text>
    </svg>
  );
}

function RoomCard({ song }: { song: SongCatalogItem }) {
  const gapScore = getSongGapScore(song);
  const readiness = getSongReadinessScore(song);
  const estimatedGap = getSongEstimatedGap(song);
  const meta = [song.isrc, song.releaseDate, song.territory].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/projects/${song.id}`}
      className="flex items-center gap-4 rounded-[18px] glass-subtle px-5 py-4 press card-shadow"
    >
      <ReadinessRing score={readiness} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-white/90 truncate">{song.title}</div>
        {meta && <div className="mt-0.5 text-[11px] text-white/35 truncate">{meta}</div>}
        <div className="mt-2 flex items-center gap-2">
          {estimatedGap > 0 && (
            <span className="rounded-full bg-[#f0a832]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#f0a832]">
              {formatGapEstimate(estimatedGap)} gap
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${gapScoreClass(gapScore)}`}>
            {gapScore}% uncollected
          </span>
        </div>
      </div>
      <span className="shrink-0 text-white/30 text-sm">→</span>
    </Link>
  );
}

export default function ProjectsPage() {
  const { songs } = usePocket();

  return (
    <AppShell title="" eyebrow="">
      <main className="mx-auto max-w-md space-y-4 text-white/90">

        <header className="flex items-center justify-between px-1 pt-2">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Rooms</div>
            <div className="text-[15px] text-white/90">
              {songs.length > 0 ? `${songs.length} release${songs.length === 1 ? "" : "s"}` : "Your releases"}
            </div>
          </div>
          <Link
            href="/projects/new"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 press"
          >
            + Add room
          </Link>
        </header>

        {songs.length === 0 ? (
          <section className="rounded-[20px] glass-dark p-6 card-shadow-dark">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">No rooms yet</div>
            <div className="mt-2 text-sm leading-6 text-white/50">
              Add one release and Pocket opens the room: readiness score, gap scan, vault tracking, and your next best move.
            </div>
            <div className="mt-4 space-y-2">
              {[
                { step: "1", label: "Add your first release", href: "/projects/new" },
                { step: "2", label: "Open the room", href: "/projects/new" },
                { step: "3", label: "File core assets in vault", href: "/vault" },
              ].map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="flex items-center gap-3 rounded-[14px] border-[0.5px] border-white/8 px-4 py-3 hover:bg-white/5 press"
                >
                  <div className="grid size-5 shrink-0 place-items-center rounded-full border border-white/20 text-[10px] font-medium text-white/40">
                    {item.step}
                  </div>
                  <div className="text-[14px] text-white/90">{item.label}</div>
                  <div className="ml-auto text-[11px] text-[#7c6fef]">→</div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="space-y-2">
            {songs.map((song) => (
              <RoomCard key={song.id} song={song} />
            ))}
          </section>
        )}

      </main>
    </AppShell>
  );
}

function gapScoreClass(score: number) {
  if (score >= 60) return "bg-[#e24b4a]/15 text-[#f05c5c]";
  if (score > 0) return "bg-[#ef9f27]/20 text-[#f0a832]";
  return "bg-[#97c459]/25 text-[#5fcf7e]";
}
