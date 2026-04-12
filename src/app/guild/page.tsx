"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const matches = [
  { name: "Mara Vale", role: "Producer", tags: "lo-fi R&B · keys · warm drums", fit: "Completes your next single" },
  { name: "Trey Sol", role: "Mix engineer", tags: "alt pop · vocal polish", fit: "Useful before release week" },
  { name: "Nia June", role: "Songwriter", tags: "hooks · late-night records", fit: "Strong match for topline work" },
];

export default function GuildPage() {
  const { songs } = usePocket();
  const activeSong = songs[0];

  return (
    <AppShell title="The Guild" eyebrow="Collaboration">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">The Guild</div>
          <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Build the team around the song.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            This is not a feed. It is a matching system for collaborators who help finish, protect, and release better work.
          </p>
        </section>

        <section className="mt-5 grid gap-3">
          {matches.map((match) => (
            <div key={match.name} className="rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[15px] font-medium text-[#111]">{match.name}</div>
                  <div className="mt-1 text-sm text-[#6b6b65]">{match.role} · {match.tags}</div>
                  <p className="mt-2 text-sm leading-6 text-[#514d47]">{match.fit}</p>
                </div>
                <button type="button" className="rounded-lg border-[0.5px] border-black/15 bg-white px-4 py-2 text-sm text-[#111]">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#eeedfe] bg-[#eeedfe] p-4 text-sm leading-6 text-[#534ab7]">
          Full opt-in profiles, matching, requests, and shared Rooms are Phase 14. For now, The Guild has a real product place inside Work and points back to the Room where collaboration becomes managed.
        </section>

        {activeSong ? (
          <Link href={`/projects/${activeSong.id}`} className="mt-5 inline-flex rounded-lg bg-[#0d0d0b] px-5 py-3 text-sm font-medium text-white">
            Open {activeSong.title}
          </Link>
        ) : null}
      </main>
    </AppShell>
  );
}
