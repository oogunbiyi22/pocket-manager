"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { PocketSheet } from "@/components/pocket-sheet";
import {
  formatGapEstimate,
  getNextRevenueAction,
  getRevenueGapSummary,
  getSongReadinessScore,
} from "@/lib/backstage-data";
import { usePocket } from "@/components/pocket-provider";

const navItems = [
  { href: "/mobile", label: "Home", icon: "⌂" },
  { href: "/work", label: "Work", icon: "♪" },
  { href: "/signal", label: "Signal", icon: "◎" },
  { href: "/harvest", label: "Harvest", icon: "$" },
  { href: "/settings", label: "Profile", icon: "○" },
];

const mobileNavItems = navItems;

export function AppShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { songs } = usePocket();
  const [pocketOpen, setPocketOpen] = useState(false);
  const activeSong = songs[0];
  const summary = getRevenueGapSummary(songs);
  const nextAction = getNextRevenueAction(songs);
  const activeReadiness = activeSong ? getSongReadinessScore(activeSong) : 0;
  const activeNav = getActiveSurface(pathname);

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-[#111]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f4f1eb]/80 px-4 py-3 backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)] sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/" className="shrink-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Pocket</div>
            <div className="mt-1 text-base font-normal tracking-tight text-[#111]">Manager</div>
          </Link>

          <nav className="hidden flex-1 justify-center gap-1 rounded-xl border-[0.5px] border-black/15 bg-white p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  activeNav === item.label
                    ? "bg-[#0a0a0a] text-white"
                    : "text-[#5d5a54] hover:bg-[#f4f1eb] hover:text-[#111]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href={`/projects/${activeSong?.id ?? "late-nights"}`}
              className="rounded-lg border-[0.5px] border-black/15 bg-white px-4 py-2 text-xs text-[#514d47] transition hover:bg-[#f4f1eb] hover:text-[#111]"
            >
              {activeSong?.title ?? "Catalog"} · {activeReadiness}/100
            </Link>
            <Link
              href="/mobile"
              className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-xs font-medium text-white transition hover:bg-black/80"
            >
              Open home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 py-7 pb-28 sm:px-8 lg:px-10 lg:py-10">
        <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.95fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6d6860]">
              <span>{activeNav}</span>
              {eyebrow ? <span className="text-[#854f0b]">{eyebrow}</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-normal tracking-tight text-[#111] sm:text-4xl">{title}</h1>
          </div>

          <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6d6860]">Next action</div>
                <div className="mt-2 truncate text-sm text-[#111]">
                  {nextAction.title} · {formatGapEstimate(nextAction.estimatedValue)}
                </div>
                <div className="mt-2 line-clamp-2 text-sm leading-6 text-[#6d6860]">
                  {summary.songsWithGaps} songs not fully registered.
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`/projects/${nextAction.songId}`}
                  className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-xs font-medium text-white transition hover:bg-black/80"
                >
                  Start
                </Link>
                <Link
                  href="/settings"
                  className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-xs text-[#514d47] transition hover:bg-[#f4f1eb] hover:text-[#111]"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>

      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
        <nav className="grid grid-cols-5 rounded-xl border-[0.5px] border-black/15 bg-[#f5f4f0]/85 px-1 py-2 backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)]">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center transition hover:bg-white"
            >
              <span className={`text-sm leading-none ${activeNav === item.label ? "text-[#0d0d0b]" : "text-[#9a9a8a]"}`}>{item.icon}</span>
              <span className={`text-[9px] leading-none ${activeNav === item.label ? "font-medium text-[#0d0d0b]" : "text-[#9a9a8a]"}`}>
                {item.label}
              </span>
              <span className={`h-[3px] w-4 rounded-full ${activeNav === item.label ? "bg-[#0d0d0b]" : "bg-transparent"}`} />
            </Link>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => setPocketOpen(true)}
        className="fixed bottom-24 left-4 z-50 grid size-12 place-items-center rounded-full border-[0.5px] border-black/15 bg-white text-2xl font-light text-[#0a0a0a] md:bottom-6"
        aria-label="Open Pocket"
      >
        +
      </button>
      <PocketSheet open={pocketOpen} onClose={() => setPocketOpen(false)} />
      <motion.div
        className="fixed bottom-24 right-4 z-50 md:bottom-6"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
      >
        <Link
          href="/a"
          className="relative grid size-12 place-items-center rounded-full border-[0.5px] border-black/15 bg-[#0d0d0b] text-[15px] font-medium text-[#f5f4f0]"
          aria-label="Open A"
        >
          A
          <span className="absolute right-0 top-0 size-2 rounded-full bg-[#ef9f27]" />
        </Link>
      </motion.div>
    </div>
  );
}

function getActiveSurface(pathname: string) {
  if (pathname.startsWith("/mobile")) return "Home";
  if (
    pathname.startsWith("/work") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/albums") ||
    pathname.startsWith("/radar") ||
    pathname.startsWith("/vault") ||
    pathname.startsWith("/guild")
  ) {
    return "Work";
  }
  if (
    pathname.startsWith("/signal") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/epk") ||
    pathname.startsWith("/pitch-kits") ||
    pathname.startsWith("/sync")
  ) {
    return "Signal";
  }
  if (
    pathname.startsWith("/harvest") ||
    pathname.startsWith("/financial") ||
    pathname.startsWith("/actions") ||
    pathname.startsWith("/statements") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/beats") ||
    pathname.startsWith("/forecast") ||
    pathname.startsWith("/valuation")
  ) {
    return "Harvest";
  }
  if (pathname.startsWith("/settings") || pathname.startsWith("/platforms") || pathname.startsWith("/notifications")) {
    return "Profile";
  }
  if (pathname.startsWith("/pocket") || pathname.startsWith("/drop") || pathname.startsWith("/capture")) return "Pocket";
  if (pathname.startsWith("/a") || pathname.startsWith("/manager")) return "A";
  return "Pocket";
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border-[0.5px] border-black/15 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-normal tracking-tight text-[#111]">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d6860]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
