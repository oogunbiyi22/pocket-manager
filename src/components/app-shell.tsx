"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { PocketSheet } from "@/components/pocket-sheet";
import { AChatOverlay, DraggableAButton } from "@/components/a-chat-overlay";
import { usePocket } from "@/components/pocket-provider";
import { LogoWordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-provider";

// ─── SVG Icons ─────────────────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function IconWork({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
      <path d="M7 3.338A9.954 9.954 0 0112 2c5.523 0 10 4.477 10 10" />
    </svg>
  );
}

function IconSignal({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01M7 20v-4M12 20V10M17 20V4M22 20h.01" />
    </svg>
  );
}

function IconHarvest({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ─── Navigation ────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/home",    label: "Home",    Icon: IconHome },
  { href: "/work",    label: "Work",    Icon: IconWork },
  { href: "/signal",  label: "Signal",  Icon: IconSignal },
  { href: "/harvest", label: "Harvest", Icon: IconHarvest },
  { href: "/profile", label: "Profile", Icon: IconProfile },
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
    pathname.startsWith("/sync") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/venues") ||
    pathname.startsWith("/radio")
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
  const { signedIn, profile } = usePocket();

  return (
    <div className="min-h-screen text-[var(--text-primary)]">

      {/* ── Frosted nav bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-black/[0.05] glass px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/home" className="shrink-0 press">
            <LogoWordmark size={28} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 justify-center gap-1 rounded-xl border border-black/[0.06] bg-white/60 p-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[#0d0d0b] text-white"
                      : "text-[#6b6b65] hover:bg-[#f5f4f0] hover:text-[#0d0d0b]"
                  }`}
                >
                  <item.Icon active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth-aware right action */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <ThemeToggle className="text-[var(--text-muted)] border border-[var(--border-subtle)]" />
            {signedIn ? (
              <Link
                href="/settings"
                className="grid size-8 place-items-center rounded-full bg-[var(--bg-dark)] text-xs font-medium text-[var(--bg-base)] transition hover:opacity-80"
                aria-label="Profile"
              >
                {profile.artistName?.[0]?.toUpperCase() ?? "A"}
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg border border-[var(--border-subtle)] glass px-4 py-2 text-xs text-[var(--text-muted)] transition hover:opacity-80"
              >
                Sign in
              </Link>
            )}
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
              <h1 className="mt-2 text-3xl font-normal tracking-tight text-[var(--text-primary)] sm:text-4xl">{title}</h1>
            )}
          </header>
        )}
        {children}
      </main>

      {/* ── Frosted mobile tab bar ──────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav className="mx-3 mb-3 grid grid-cols-5 rounded-2xl glass px-1 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition active:scale-90 ${
                  isActive ? "text-[#0d0d0b]" : "text-[#9a9a92]"
                }`}
              >
                <item.Icon active={isActive} />
                <span className={`text-[9px] leading-none ${isActive ? "font-semibold" : "font-normal"}`}>
                  {item.label}
                </span>
                <span className={`h-[2.5px] w-3 rounded-full transition-all duration-200 ${isActive ? "bg-[#0d0d0b] w-5" : "bg-transparent"}`} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Floating Pocket button ───────────────────────────────── */}
      <button
        type="button"
        onClick={() => setPocketOpen(true)}
        className="fixed bottom-[76px] left-4 z-50 grid size-11 place-items-center rounded-full backdrop-blur-md bg-[rgba(13,13,11,0.92)] text-white text-xl font-light shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition active:scale-90 md:bottom-6"
        aria-label="Open Pocket"
      >
        +
      </button>

      {/* ── Draggable A avatar ───────────────────────────────────── */}
      <DraggableAButton onOpen={() => setAOpen(true)} />

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
    <section className="rounded-2xl glass p-6">
      <div className="mb-5">
        <h2 className="text-lg font-normal tracking-tight text-[#0d0d0b]">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6b65]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
