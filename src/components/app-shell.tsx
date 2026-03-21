import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/projects", label: "Projects" },
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
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.02] px-6 py-8 lg:flex lg:flex-col">
          <Link href="/" className="mb-10 block">
            <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
              Backstage
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Artist command center
            </div>
          </Link>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-white/70 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Backstage Vault
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Storage, backup, and project assets live here. Keep every release in one place.
            </p>
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {eyebrow ? (
                <div className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                  {eyebrow}
                </div>
              ) : null}
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href="/projects/new"
                className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:bg-emerald-200"
              >
                New project
              </Link>
              <Link
                href="/manager"
                className="rounded-full border border-white/15 px-5 py-3 text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Open manager
              </Link>
            </div>
          </header>
          {children}
        </main>
      </div>
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="mb-5">
        <h2 className="text-lg font-medium tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
