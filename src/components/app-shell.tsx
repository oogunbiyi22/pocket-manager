"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePocket } from "@/components/pocket-provider";
import { LogoWordmark } from "@/components/logo";

const PocketSheet = dynamic(() => import("@/components/pocket-sheet").then(m => ({ default: m.PocketSheet })), { ssr: false });
const AChatOverlay = dynamic(() => import("@/components/a-chat-overlay").then(m => ({ default: m.AChatOverlay })), { ssr: false });
const DraggableAButton = dynamic(() => import("@/components/a-chat-overlay").then(m => ({ default: m.DraggableAButton })), { ssr: false });

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
  { href: "/mobile", label: "Home", Icon: IconHome },
  { href: "/projects", label: "Rooms", Icon: IconWork },
  { href: "/vault", label: "Vault", Icon: IconSignal },
  { href: "/harvest", label: "Gap", Icon: IconHarvest },
  { href: "/settings", label: "Settings", Icon: IconProfile },
] as const;

function getActiveSurface(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/home") || pathname.startsWith("/mobile")) return "Home";
  if (
    pathname.startsWith("/work") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/albums") ||
    pathname.startsWith("/radar") ||
    pathname.startsWith("/guild")
  ) return "Rooms";
  if (pathname.startsWith("/vault")) return "Vault";
  if (
    pathname.startsWith("/harvest") ||
    pathname.startsWith("/financial") ||
    pathname.startsWith("/actions") ||
    pathname.startsWith("/statements") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/beats") ||
    pathname.startsWith("/forecast") ||
    pathname.startsWith("/valuation") ||
    pathname.startsWith("/publishing")
  ) return "Gap";
  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/platforms") ||
    pathname.startsWith("/notifications")
  ) return "Settings";
  if (pathname.startsWith("/pocket") || pathname.startsWith("/drop") || pathname.startsWith("/capture")) return "Home";
  if (pathname.startsWith("/a") || pathname.startsWith("/manager")) return "Home";
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
  const router = useRouter();
  const [pocketOpen, setPocketOpen] = useState(false);
  const [aOpen, setAOpen] = useState(false);
  const activeNav = getActiveSurface(pathname);
  const { signedIn, profile } = usePocket();

  useEffect(() => {
    if (!signedIn || profile.onboarded) {
      return;
    }

    router.replace("/onboarding");
  }, [profile.onboarded, router, signedIn]);

  return (
    <div className="min-h-screen" style={{ color: "var(--text-primary)" }}>

      {/* ── HUD header bar ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 sm:px-6"
        style={{
          background: "linear-gradient(180deg, rgba(13,13,11,0.97) 0%, rgba(13,13,11,0.88) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderBottom: "0.5px solid rgba(245,244,240,0.07)",
          boxShadow: "0 1px 0 rgba(239,159,39,0.04) inset",
          // Fill the iOS notch/status-bar so a pull-down never reveals bg above the bar.
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingBottom: "0.75rem",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/mobile" className="shrink-0 press" style={{ opacity: 0.9 }}>
            <LogoWordmark size={28} />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden flex-1 justify-center gap-0.5 rounded-2xl p-1 md:flex"
            style={{
              background: "rgba(245,244,240,0.03)",
              border: "0.5px solid rgba(245,244,240,0.06)",
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
                    background: "linear-gradient(135deg, rgba(239,159,39,0.15) 0%, rgba(200,169,122,0.10) 100%)",
                    border: "0.5px solid rgba(239,159,39,0.22)",
                    color: "var(--amber)",
                    boxShadow: "0 0 12px rgba(239,159,39,0.10)",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                  } : {
                    color: "rgba(245,244,240,0.35)",
                  }}
                >
                  <item.Icon active={isActive} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right — identity / sign-in */}
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
                  background: "linear-gradient(135deg, rgba(239,159,39,0.25), rgba(200,169,122,0.2))",
                  border: "0.5px solid rgba(239,159,39,0.35)",
                  color: "var(--amber)",
                  boxShadow: "0 0 10px rgba(239,159,39,0.12)",
                }}
                aria-label="Profile"
              >
                {profile.artistName?.[0]?.toUpperCase() ?? "A"}
              </Link>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  href="/sign-in?mode=sign-up"
                  className="press"
                  style={{
                    padding: "6px 16px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 500,
                    background: "linear-gradient(135deg, rgba(239,159,39,0.2), rgba(200,169,122,0.15))",
                    border: "0.5px solid rgba(239,159,39,0.3)",
                    color: "var(--amber)",
                  }}
                >
                  Get started free
                </Link>
                <Link
                  href="/sign-in"
                  className="press"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    border: "0.5px solid rgba(245,244,240,0.08)",
                    color: "rgba(245,244,240,0.35)",
                    background: "transparent",
                  }}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main className="relative mx-auto max-w-7xl px-5 py-7 pb-32 sm:px-8 lg:px-10 lg:py-10">
        {(title || eyebrow) && (
          <header className="mb-8">
            {eyebrow && (
              <div className="label-upper" style={{ color: "rgba(239,159,39,0.5)", marginBottom: 6 }}>{eyebrow}</div>
            )}
            {title && (
              <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 200, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--text-primary)", margin: 0 }}>{title}</h1>
            )}
          </header>
        )}
        {children}
      </main>

      {/* ── Floating mobile tab bar ──────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav
          className="mx-3 mb-3 grid grid-cols-5 rounded-2xl px-1 py-2"
          style={{
            background: "linear-gradient(180deg, rgba(13,13,11,0.97) 0%, rgba(13,13,11,0.99) 100%)",
            backdropFilter: "blur(60px) saturate(200%)",
            WebkitBackdropFilter: "blur(60px) saturate(200%)",
            border: "0.5px solid rgba(245,244,240,0.08)",
            boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(245,244,240,0.04) inset",
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
                  color: "var(--amber)",
                } : {
                  color: "rgba(245,244,240,0.28)",
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
                    background: isActive ? "var(--amber)" : "transparent",
                    boxShadow: isActive ? "0 0 6px var(--amber)" : "none",
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Pocket button ────────────────────────────────────────── */}
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
          background: "linear-gradient(135deg, rgba(239,159,39,0.5) 0%, rgba(200,169,122,0.4) 100%)",
          border: "0.5px solid rgba(239,159,39,0.55)",
          color: "#fff",
          fontSize: 20,
          fontWeight: 200,
          boxShadow: "0 0 20px rgba(239,159,39,0.35), 0 4px 16px rgba(0,0,0,0.6)",
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
        background: "rgba(245,244,240,0.03)",
        border: "0.5px solid rgba(245,244,240,0.07)",
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
