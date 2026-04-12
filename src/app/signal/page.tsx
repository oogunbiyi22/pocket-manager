"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

const signalAreas = [
  {
    href: "/pitch-kits",
    title: "Pitch kit",
    body: "Create a focused outreach package for playlists, labels, blogs, booking, and sync.",
  },
  {
    href: "/epk",
    title: "EPK",
    body: "Build the living page that makes the artist look ready for serious opportunities.",
  },
  {
    href: "/sync",
    title: "Sync matches",
    body: "Match catalog metadata against active brief-style opportunities.",
  },
  {
    href: "/studio",
    title: "Promo Studio",
    body: "Draft release assets once the Signal generation pipeline is ready.",
  },
];

export default function SignalPage() {
  const { songs } = usePocket();
  const activeSong = songs[0];

  return (
    <AppShell title="Signal" eyebrow="Get heard">
      <main className="mx-auto max-w-4xl rounded-[24px] border-[0.5px] border-black/15 bg-[#f0efe8] p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0d0d0b] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Get heard</div>
          <h2 className="mt-3 text-4xl font-light tracking-[-0.03em]">Send the right song to the right place.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Start with {activeSong?.title ?? "a song"}: build the package, match the opportunity, then pitch with context.
          </p>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {signalAreas.map((area) => (
            <Link key={area.href} href={area.href} className="rounded-xl border-[0.5px] border-black/15 bg-white p-4 transition hover:border-black/35">
              <div className="text-[15px] font-medium text-[#111]">{area.title}</div>
              <p className="mt-2 text-sm leading-6 text-[#6b6b65]">{area.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
