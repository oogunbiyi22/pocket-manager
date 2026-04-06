"use client";

import Link from "next/link";
import { usePocket } from "@/components/pocket-provider";
import {
  getOpportunityFeed,
  getPocketSystemSnapshot,
  getProjectMemory,
} from "@/lib/backstage-data";

const desktopActions = [
  {
    title: "Sign in and check the day",
    copy: "Desktop should still let you open your rooms, read the brief, and handle small admin moves.",
  },
  {
    title: "Review release readiness",
    copy: "Use the desktop surface to scan blockers, room health, and what needs a decision.",
  },
  {
    title: "Hand off to mobile",
    copy: "When the day starts moving, Pocket Manager should fully live in your hand.",
  },
];

const mobileReasons = [
  "Voice notes, capture, and quick tasking should feel native to being outside.",
  "The active room should be one tap away, not buried inside desktop navigation.",
  "The manager brief should tell you what matters before you unlock another app.",
];

const productTruths = [
  "Release readiness should tell the truth, not flatter the user.",
  "The vault should remember context, not just store files.",
  "Pocket should recommend the next move before the artist asks.",
];

export default function Home() {
  const { projects, activeProject } = usePocket();
  const snapshot = getPocketSystemSnapshot(projects);
  const opportunities = getOpportunityFeed(activeProject);
  const projectMemory = getProjectMemory(activeProject);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Pocket Manager</div>
            <div className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              Desktop is the landing page, sign-in point, and light-control surface. The real product should fully function in your pocket.
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/sign-in"
              className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-emerald-200"
            >
              Sign in
            </Link>
            <Link
              href="/mobile"
              className="rounded-full border border-white/15 px-5 py-3 text-white/85 transition hover:border-white/30 hover:text-white"
            >
              Open mobile preview
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.35em] text-emerald-300/80">
              Mobile-first manager for artists
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              The desktop introduces the system. The phone runs the day.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
              Pocket Manager helps artists move releases, assets, notes, and decisions without letting the business side swallow the music. Desktop stays light. Mobile carries the real workflow.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <StatCard label="Readiness" value={`${snapshot.averageReadiness}%`} />
              <StatCard label="Active rooms" value={`${snapshot.activeProjects}`} />
              <StatCard label="Urgent rooms" value={`${snapshot.urgentProjects}`} />
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {productTruths.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm leading-6 text-white/70">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/sign-in"
                className="rounded-full bg-emerald-400 px-6 py-4 font-medium text-black transition hover:bg-emerald-300"
              >
                Sign in to Pocket Manager
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 px-6 py-4 font-medium text-white/85 transition hover:border-white/30 hover:text-white"
              >
                Enter desktop overview
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
              <div className="rounded-[1.7rem] border border-emerald-300/15 bg-[#0d1118] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-emerald-300/70">Desktop landing</div>
                    <div className="mt-2 text-2xl font-medium text-white">Light-control surface</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">Browser</div>
                </div>
                <div className="mt-6 space-y-3 text-sm leading-7 text-white/70">
                  {desktopActions.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="mt-2 text-white/60">{item.copy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-300/6 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-emerald-200/75">Mobile core</div>
                  <div className="mt-2 text-xl font-medium text-white">{activeProject.name}</div>
                </div>
                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                  {activeProject.daysLeft} days left
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-white/75">
                {mobileReasons.map((item) => (
                  <li key={item} className="rounded-2xl border border-emerald-300/15 bg-black/15 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Opportunity feed</div>
                <div className="mt-4 space-y-3 text-sm text-white/75">
                  {opportunities.slice(0, 2).map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="mt-2 leading-6 text-white/65">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Project memory</div>
                <div className="mt-4 space-y-3 text-sm text-white/75">
                  {projectMemory.slice(0, 2).map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5">
      <div className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}
