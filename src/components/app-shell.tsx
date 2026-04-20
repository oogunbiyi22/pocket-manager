"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { PocketSheet } from "@/components/pocket-sheet";
import { AChatOverlay, DraggableAButton } from "@/components/a-chat-overlay";
import { usePocket } from "@/components/pocket-provider";
import { LogoWordmark } from "@/components/logo";

// ─── SVG Icons ─────────────────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function IconWork({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

function IconSignal({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01M7 20v-4M12 20V10M17 20V4M22 20h.01" />
    </svg>
  );
}

function IconHarvest({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
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
    pathname.startsWith("/pitching") ||
    pathname.startsWith("/career-twin") ||
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
    <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>

      {/* ── HUD header bar ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 py-3 sm:px-6"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,14,0.95) 0%, rgba(3,3,15,0.85) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "0.5px solid rgba(0, 212, 255, 0.08)",
          boxShadow: "0 1px 0 rgba(0,212,255,0.04) inset",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/home" className="shrink-0 press" style={{ opacity: 0.9 }}>
            <LogoWordmark size={28} />
          </Link>

          {/* Desktop nav — holographic pill */}
          <nav
            className="hidden flex-1 justify-center gap-0.5 rounded-2xl p-1 md:flex"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm transition-all duration-200 press"
                  style={isActive ? {
                    background: "linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(0,212,255,0.12) 100%)",
                    border: "0.5px solid rgba(0,212,255,0.2)",
                    color: "var(--cyan)",
                    boxShadow: "0 0 12px rgba(0,212,255,0.12)",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                  } : {
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  <item.Icon active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right — identity orb */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {signedIn ? (
              <Link
                href="/settings"
                className="press"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(0,212,255,0.3))",
                  border: "0.5px solid rgba(0,212,255,0.3)",
                  color: "var(--cyan)",
                  boxShadow: "0 0 12px rgba(0,212,255,0.15)",
                }}
                aria-label="Profile"
              >
                {profile.artistName?.[0]?.toUpperCase() ?? "A"}
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="press"
                style={{
                  padding: "6px 16px",
                  borderRadius: 10,
                  fontSize: 12,
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.03)",
                }}
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
              <div className="label-upper" style={{ color: "rgba(0,212,255,0.5)", marginBottom: 6 }}>{eyebrow}</div>
            )}
            {title && (
              <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--text-primary)", margin: 0 }}>{title}</h1>
            )}
          </header>
        )}
        {children}
      </main>

      {/* ── Floating mobile tab bar — HUD control panel ──────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav
          className="mx-3 mb-3 grid grid-cols-5 rounded-2xl px-1 py-2"
          style={{
            background: "linear-gradient(180deg, rgba(8,8,24,0.96) 0%, rgba(3,3,15,0.98) 100%)",
            backdropFilter: "blur(60px) saturate(200%)",
            WebkitBackdropFilter: "blur(60px) saturate(200%)",
            border: "0.5px solid rgba(0,212,255,0.1)",
            boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-all duration-200 active:scale-90"
                style={isActive ? {
                  color: "var(--cyan)",
                } : {
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                <item.Icon active={isActive} />
                <span
                  className="label-mono"
                  style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1 }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    height: 2,
                    width: isActive ? 16 : 0,
                    borderRadius: 1,
                    background: isActive ? "var(--cyan)" : "transparent",
                    boxShadow: isActive ? "0 0 6px var(--cyan)" : "none",
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Pocket button — plasma orb ───────────────────────────── */}
      <button
        type="button"
        onClick={() => setPocketOpen(true)}
        className="fixed bottom-[76px] left-4 z-50 press"
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(0,212,255,0.4) 100%)",
          border: "0.5px solid rgba(168,85,247,0.5)",
          color: "#fff",
          fontSize: 20,
          fontWeight: 200,
          boxShadow: "0 0 20px rgba(168,85,247,0.4), 0 4px 16px rgba(0,0,0,0.6)",
        }}
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
    <section
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(40px)",
      }}
    >
      <div className="mb-5">
        <h2 style={{ fontSize: 18, fontWeight: 300, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 8px" }}>{title}</h2>
        {description ? <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", margin: 0 }}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
