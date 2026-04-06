"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { getActiveRoomSummary, getPocketSystemSnapshot } from "@/lib/backstage-data";
import { usePocket } from "@/components/pocket-provider";

const navItems = [
  { href: "/dashboard", label: "Today" },
  { href: "/mobile", label: "Mobile" },
  { href: "/projects", label: "Projects" },
  { href: "/capture", label: "Capture" },
  { href: "/vault", label: "Vault" },
  { href: "/manager", label: "Manager" },
  { href: "/settings", label: "Settings" },
];

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
  const { projects } = usePocket();
  const systemSnapshot = getPocketSystemSnapshot(projects);
  const activeProject = projects[0];
  const activeRoom = getActiveRoomSummary(activeProject);
  const activeNav = navItems.find((item) => isNavActive(pathname, item.href))?.label ?? "Pocket";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-white/[0.02] px-5 py-5 lg:min-h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
          <Link href="/" className="block">
            <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Pocket Manager</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Artist operator</div>
          </Link>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:hidden">
            <Link
              href="/capture"
              className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-sm text-emerald-100 transition hover:border-emerald-300/30"
            >
              Capture
            </Link>
            <Link
              href="/projects"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
            >
              Projects
            </Link>
          </div>

          <nav className="mt-8 hidden space-y-2 lg:block">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl border px-4 py-3 text-sm transition ${
                  isNavActive(pathname, item.href)
                    ? "border-emerald-300/20 bg-emerald-300/10 text-white"
                    : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 lg:mt-auto">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Pocket promise</div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Desktop should stay light. The phone should carry the real daily operating flow.
            </p>
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 pb-28 sm:px-8 lg:px-10 lg:py-8 lg:pb-8">
          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <PocketStat label="Active" value={`${systemSnapshot.activeProjects}`} detail="Live rooms in the stack" />
            <PocketStat label="Urgent" value={`${systemSnapshot.urgentProjects}`} detail="Rooms inside tighter windows" />
            <PocketStat label="Blocked" value={`${systemSnapshot.blockedProjects}`} detail="Rooms carrying active drag" />
            <PocketStat label="Readiness" value={`${systemSnapshot.averageReadiness}%`} detail="Average package strength" />
          </div>

          <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">{activeNav}</div>
              {eyebrow ? (
                <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">{eyebrow}</div>
              ) : null}
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/capture"
                className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-emerald-200"
              >
                Open capture
              </Link>
              <Link
                href="/projects"
                className="rounded-full border border-white/15 px-5 py-3 text-white/80 transition hover:border-white/30 hover:text-white"
              >
                View projects
              </Link>
            </div>
          </header>

          <div className="mb-4 rounded-3xl border border-emerald-300/15 bg-emerald-300/6 px-5 py-4 text-sm text-white/75">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Active room summary</div>
                <div className="mt-2 text-white">
                  {activeRoom.name} · {activeRoom.state} · {activeRoom.readiness}% ready
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
                <span className="rounded-full border border-white/10 px-2.5 py-1">{activeRoom.pressure}</span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">{activeRoom.blocked} blocked</span>
              </div>
            </div>
            <div className="mt-3 leading-6 text-white/65">{activeRoom.nextMove}</div>
          </div>

          <div className="mb-8 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/projects/${activeProject.id}`}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-2.5 text-emerald-100 transition hover:border-emerald-300/35"
            >
              Active room: {activeProject.name}
            </Link>
            <Link
              href="/manager"
              className="rounded-full border border-white/10 px-4 py-2.5 text-white/75 transition hover:border-white/20 hover:text-white"
            >
              Open manager brief
            </Link>
            <Link
              href="/projects/new"
              className="rounded-full border border-white/10 px-4 py-2.5 text-white/75 transition hover:border-white/20 hover:text-white"
            >
              Create new room
            </Link>
            <Link
              href="/capture"
              className="rounded-full border border-white/10 px-4 py-2.5 text-white/75 transition hover:border-white/20 hover:text-white"
            >
              Jump to capture
            </Link>
          </div>
          {children}
        </main>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <nav className="grid grid-cols-7 rounded-[1.75rem] border border-white/10 bg-[#0b0d13]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-3 py-3 text-center text-[11px] font-medium uppercase tracking-[0.16em] transition ${
                isNavActive(pathname, item.href)
                  ? "bg-emerald-300/10 text-emerald-100"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function PocketStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/65">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/55">{detail}</div>
    </div>
  );
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm">
      <div className="mb-5">
        <h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
