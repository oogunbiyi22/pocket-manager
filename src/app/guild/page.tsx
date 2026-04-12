"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const matches = [
  { name: "Nova Keys", initials: "NK", role: "Producer", tags: "Lo-fi soul · warm drums", fit: "Open to collabs", tone: "purple" },
  { name: "Remy Sol", initials: "RM", role: "Songwriter", tags: "R&B · neo soul hooks", fit: "Co-write match", tone: "green" },
  { name: "Ayo J", initials: "AJ", role: "Artist", tags: "Afrobeats · R&B feature", fit: "Feature match", tone: "pink" },
];

export default function GuildPage() {
  const { songs } = usePocket();
  const activeSong = songs[0];

  return (
    <AppShell title="The Guild" eyebrow="Collaboration">
      <main className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">
        <section className="border-b-[0.5px] border-white/10 bg-[#0d0d0b] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">The Guild</div>
          <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Find your creative circle.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            No feeds. No likes. Just opt-in matching for people who help finish, protect, and release the work.
          </p>
          <div className="mt-4 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm text-white/35">
            Search by genre, role, or vibe...
          </div>
        </section>

        <section className="p-5">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6a6a5a]">Matched for you</div>
          <div className="grid gap-3">
          {matches.map((match) => (
            <div key={match.name} className="rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] p-4">
              <div className="flex items-center gap-3">
                <div className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-medium ${avatarClass(match.tone)}`}>
                  {match.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-medium text-white">{match.name}</div>
                  <div className="mt-1 truncate text-xs text-white/35">{match.role} · {match.tags}</div>
                  <p className="mt-2 text-sm leading-6 text-white/55">{match.fit}</p>
                </div>
                <button type="button" className="rounded-lg bg-[#eeedfe] px-4 py-2 text-sm font-medium text-[#534ab7]">
                  Connect
                </button>
              </div>
            </div>
          ))}
          </div>
        </section>

        <section className="mx-5 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] p-4 text-sm leading-6 text-white/65">
          <div className="text-[15px] font-medium text-white">Your active collab</div>
          <p className="mt-2 text-white/40">Nova Keys · “Slow Down” · Room shared</p>
          {activeSong ? (
            <Link href={`/projects/${activeSong.id}`} className="mt-3 inline-flex text-sm font-medium text-[#185fa5]">
              Open The Room →
            </Link>
          ) : null}
        </section>

        <section className="m-5 rounded-xl border-[0.5px] border-[#eeedfe] bg-[#eeedfe] p-4 text-sm leading-6 text-[#534ab7]">
          Full opt-in profiles, matching, requests, and shared Rooms are Phase 14. For now, The Guild has a real product place inside Work and points back to the Room where collaboration becomes managed.
        </section>
      </main>
    </AppShell>
  );
}

function avatarClass(tone: string) {
  if (tone === "green") return "bg-[#9fe1cb] text-[#085041]";
  if (tone === "pink") return "bg-[#f4c0d1] text-[#72243e]";
  return "bg-[#cecbf6] text-[#3c3489]";
}
