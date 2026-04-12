"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

export default function StudioPage() {
  const { songs } = usePocket();
  const activeSong = songs[0];

  return (
    <AppShell title="Studio" eyebrow="Phase 13">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Promo Studio</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Create for {activeSong?.title ?? "your catalog"}.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            V5 keeps Studio as a main tab, but generation starts in Phase 13 after the core revenue system, payments, and backend acceptance criteria pass.
          </p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {["Release Announcement", "Lyric Card", "Milestone", "Behind the Scenes", "EP Trailer", "Custom"].map((item) => (
            <div key={item} className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[15px] font-medium text-[#111]">{item}</div>
              <p className="mt-2 text-sm leading-6 text-[#6b6b65]">Locked until Phase 13 generation pipeline is ready.</p>
            </div>
          ))}
        </section>

        <section className="mt-5 rounded-xl border-[0.5px] border-[#faeeda] bg-[#faeeda] p-4 text-sm leading-6 text-[#854f0b]">
          The current build priority remains: song catalog, platform connections, gap engine, next action queue, onboarding, readiness, Pocket In, notifications, and financial basics.
        </section>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/projects/${activeSong?.id ?? "late-nights"}`} className="inline-flex rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
            Return to song room
          </Link>
          <Link href="/epk" className="inline-flex rounded-lg border-[0.5px] border-black/15 px-5 py-3 text-sm font-medium text-[#111]">
            Build EPK
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
