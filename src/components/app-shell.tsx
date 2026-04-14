"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { PocketSheet } from "@/components/pocket-sheet";
import { AChatOverlay } from "@/components/a-chat-overlay";

// ─── Navigation ────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/home",    label: "Home",    icon: "⌂" },
  { href: "/work",    label: "Work",    icon: "♪" },
  { href: "/signal",  label: "Signal",  icon: "◎" },
  { href: "/harvest", label: "Harvest", icon: "$" },
  { href: "/profile", label: "Profile", icon: "○" },
] as const;

function getActiveSurface(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/home") || pathname.startsWith("/mobile")) return "Home";
  if (
    pathname.startsWith("/work") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/albums") ||
    pathname.startsWith("/radar") ||
    pathname.startsWith("/vault") ||
    pathname.startsWith("/guild")
  ) return "Work";
  if (
    pathname.startsWith("/signal") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/epk") ||
    pathname.startsWith("/pitch-kits") ||
    pathname.startsWith("/sync")
  ) return "Signal";
  if (
    pathname.startsWith("/harvest") ||
    pathname.startsWith("/financial") ||
    pathname.startsWith("/actions") ||
    pathname.startsWith("/statements") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/beats") ||
    pathname.startsWith("/forecast") ||
    pathname.startsWith("/valuation")
  ) return "Harvest";
  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/platforms") ||
    pathname.startsWith("/notifications")
  ) return "Profile";
  if (pathname.startsWith("/pocket") || pathname.startsWith("/drop") || pathname.startsWith("/capture")) return "Pocket";
  if (pathname.startsWith("/a") || pathname.startsWith("/manager")) return "A";
  return "Home";
}

// ─── Shell ─────────────────────────────────────────────────────────────────
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
  const [pocketOpen, setPocketOpen] = useState(false);
  const [aOpen, setAOpen] = useState(false);
  const activeNav = getActiveSurface(pathname);

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-[#0d0d0b]">

      {/* ── Frosted nav bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)] bg-[rgba(245,244,240,0.72)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/home" className="shrink-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a92]">Pocket</div>
            <div className="text-base font-normal tracking-tight text-[#0d0d0b]">Manager</div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 justify-center gap-1 rounded-xl border border-black/[0.06] bg-white/60 p-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  activeNav === item.label
                    ? "bg-[#0d0d0b] text-white"
                    : "text-[#6b6b65] hover:bg-[#f5f4f0] hover:text-[#0d0d0b]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href="/home"
              className="rounded-lg border border-black/[0.12] bg-white px-4 py-2 text-xs text-[#6b6b65] transition hover:bg-[#f5f4f0]"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className="relative mx-auto max-w-7xl px-5 py-7 pb-32 sm:px-8 lg:px-10 lg:py-10">
        {(title || eyebrow) && (
          <header className="mb-8">
            {eyebrow && (
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a92]">{eyebrow}</div>
            )}
            {title && (
              <h1 className="mt-2 text-3xl font-normal tracking-tight text-[#0d0d0b] sm:text-4xl">{title}</h1>
            )}
          </header>
        )}
        {children}
      </main>

      {/* ── Frosted mobile tab bar ──────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav className="mx-3 mb-3 grid grid-cols-5 rounded-2xl border border-black/[0.06] backdrop-blur-xl [backdrop-filter:saturate(180%)_blur(20px)] bg-[rgba(245,244,240,0.72)] px-1 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-center transition active:scale-95"
            >
              <span className={`text-sm leading-none ${activeNav === item.label ? "text-[#0d0d0b]" : "text-[#9a9a92]"}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] leading-none ${activeNav === item.label ? "font-medium text-[#0d0d0b]" : "text-[#9a9a92]"}`}>
                {item.label}
              </span>
              <span className={`h-[3px] w-4 rounded-full transition-colors ${activeNav === item.label ? "bg-[#0d0d0b]" : "bg-transparent"}`} />
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Floating Pocket button (bottom-left) ────────────────── */}
      <button
        type="button"
        onClick={() => setPocketOpen(true)}
        className="fixed bottom-[72px] left-4 z-50 grid size-11 place-items-center rounded-full backdrop-blur-md bg-[rgba(13,13,11,0.92)] text-white text-xl font-light shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition active:scale-95 md:bottom-6"
        aria-label="Open Pocket"
      >
        +
      </button>

      {/* ── Floating A avatar (bottom-right) ────────────────────── */}
      <motion.button
        type="button"
        onClick={() => setAOpen(true)}
        className="fixed bottom-[72px] right-4 z-50 relative grid size-12 place-items-center rounded-full backdrop-blur-md bg-[rgba(13,13,11,0.92)] text-[15px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] md:bottom-6"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        aria-label="Open A"
      >
        A
        {/* Amber pulse dot */}
        <span className="absolute right-0 top-0 size-2 rounded-full bg-[#ef9f27] ring-2 ring-[#f5f4f0]" />
      </motion.button>

      {/* ── Pocket sheet ────────────────────────────────────────── */}
      <PocketSheet open={pocketOpen} onClose={() => setPocketOpen(false)} />

      {/* ── A chat overlay ──────────────────────────────────────── */}
      <AChatOverlay open={aOpen} onClose={() => setAOpen(false)} />
    </div>
  );
}

// ─── Utility panel component ───────────────────────────────────────────────
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
    <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-5">
        <h2 className="text-lg font-normal tracking-tight text-[#0d0d0b]">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b65]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
