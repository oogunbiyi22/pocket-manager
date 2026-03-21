import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";

const projectCards = [
  {
    name: "Late Nights",
    status: "Release prep",
    release: "Apr 12",
    next: "Upload artwork and lock pitch copy",
  },
  {
    name: "Red Room Sessions",
    status: "In progress",
    release: "TBD",
    next: "Build structure and budget plan",
  },
  {
    name: "Neon Heart",
    status: "Released",
    release: "Feb 28",
    next: "Post-release content push",
  },
];

export default function ProjectsPage() {
  return (
    <AppShell title="Projects" eyebrow="Release workspaces">
      <Panel
        title="All projects"
        description="Every project should have one clean operating space for assets, tasks, promo, budget, and notes."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {projectCards.map((project) => (
            <Link
              key={project.name}
              href="/projects/demo-project"
              className="rounded-3xl border border-white/10 bg-black/10 p-5 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-medium text-white">{project.name}</div>
                  <div className="mt-2 text-sm text-white/55">{project.status}</div>
                </div>
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">
                  {project.release}
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-white/70">Next move: {project.next}</p>
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
