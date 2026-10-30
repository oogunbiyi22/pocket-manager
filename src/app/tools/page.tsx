"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";

/**
 * Tools — the explore hub. The module pages (Venues, Radio, Sync,
 * Booking, Events, Albums, Beats, Studio, Radar) used to exist with
 * zero inbound links; this page is their front door, grouped the way
 * an artist actually works: pitch it, play it, package it.
 */

type Tool = { href: string; name: string; blurb: string };

const SECTIONS: { title: string; sub: string; tools: Tool[] }[] = [
  {
    title: "Pocket A&R",
    sub: "Pitch the room, the station, the brief.",
    tools: [
      { href: "/venues", name: "Venues", blurb: "121 venues with direct booking contacts. Pitch the room, track the reply." },
      { href: "/radio", name: "Radio", blurb: "144 stations taking submissions. Send, log, and follow up in one place." },
      { href: "/sync", name: "Sync", blurb: "22 sync companies and live briefs. Track what's pitched where." },
    ],
  },
  {
    title: "On stage & on schedule",
    sub: "Dates, holds, and deadlines.",
    tools: [
      { href: "/booking", name: "Booking", blurb: "Your live dates, holds, and terms — one tracker for every show." },
      { href: "/events", name: "Events", blurb: "Shows, sessions, and deadlines on a single calendar." },
      { href: "/radar", name: "Radar", blurb: "Countdowns and milestones built from your release dates." },
    ],
  },
  {
    title: "Build the release",
    sub: "Package the music before it ships.",
    tools: [
      { href: "/albums", name: "Albums", blurb: "Bundle songs into an EP or album package with a readiness check." },
      { href: "/studio", name: "Studio", blurb: "Captions, hashtags, and rollout posts generated from your songs." },
      { href: "/beats", name: "Beats", blurb: "Every lease and exclusive logged — amounts, buyers, expiries." },
    ],
  },
];

const MORE_TOOLS: Tool[] = [
  { href: "/publishing", name: "Publishing", blurb: "Publishing profile, PRO affiliation, and song registration status." },
  { href: "/career-twin", name: "Career Twin", blurb: "Artists who stood where you stand — and the move that broke them." },
  { href: "/pitch-kits", name: "Pitch Kits", blurb: "Ready-to-send pitch emails for curators, blogs, sync, and radio." },
];

export default function ToolsPage() {
  return (
    <AppShell title="Tools" eyebrow="All of Pocket">
      <main className="mx-auto max-w-4xl space-y-6 text-white/90">
        <header className="px-1 pt-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Tools</div>
          <h1 className="mt-1 text-[22px] font-light text-white/90">Everything Pocket can do</h1>
          <p className="mt-1 text-sm leading-6 text-white/50">
            The home surfaces cover the daily loop. These are the specialists — pitching, scheduling, and packaging tools that work off the same catalog.
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title}>
            <div className="mb-3 px-1">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">{section.title}</div>
              <div className="mt-0.5 text-[13px] text-white/45">{section.sub}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-[20px] glass card-shadow p-5 press block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium text-white/90">{tool.name}</span>
                    <span className="text-[13px] text-[#7c6fef] transition group-hover:translate-x-0.5">→</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-white/50">{tool.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-[24px] glass card-shadow px-5 py-5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Go deeper</div>
          <p className="mb-4 text-[13px] leading-5 text-white/50">Slower tools for bigger questions — ownership, trajectory, and the words that sell the song.</p>
          <div className="space-y-2">
            {MORE_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex items-start gap-3 rounded-[14px] border-[0.5px] border-white/8 px-4 py-3 transition hover:bg-white/5 press"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] text-white/90">{tool.name}</div>
                  <div className="mt-0.5 text-[11px] leading-4 text-white/40">{tool.blurb}</div>
                </div>
                <span className="mt-1 shrink-0 text-[11px] text-[#7c6fef]">→</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
