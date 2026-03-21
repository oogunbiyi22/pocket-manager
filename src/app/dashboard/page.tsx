import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";

const projects = [
  { name: "Late Nights", status: "Release prep", next: "Upload final cover art" },
  { name: "Neon Heart", status: "In progress", next: "Build 2-week rollout" },
];

export default function DashboardPage() {
  return (
    <AppShell title="Command center" eyebrow="Backstage dashboard">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Panel
          title="Manager check-in"
          description="The manager should feel like a real support layer — sharp, motivating, and focused on the next move."
        >
          <div className="space-y-4 rounded-3xl border border-emerald-300/10 bg-emerald-300/5 p-5 text-sm leading-7 text-white/75">
            <p>
              You are 12 days out from release. Lock visuals first, then start playlist outreach while the campaign still has room to breathe.
            </p>
            <p>
              Smart move today: upload your strongest assets into Backstage Vault, then generate a rollout plan from the project workspace.
            </p>
          </div>
        </Panel>

        <Panel title="Today’s priorities" description="What matters right now.">
          <ul className="space-y-3 text-sm text-white/70">
            <li className="rounded-2xl border border-white/10 px-4 py-3">Upload missing artwork</li>
            <li className="rounded-2xl border border-white/10 px-4 py-3">Write playlist pitch</li>
            <li className="rounded-2xl border border-white/10 px-4 py-3">Generate teaser captions</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Active projects" description="Jump back into the releases that need attention.">
          <div className="space-y-4">
            {projects.map((project) => (
              <Link
                key={project.name}
                href="/projects/demo-project"
                className="block rounded-3xl border border-white/10 bg-black/10 p-5 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
              >
                <div className="text-base font-medium text-white">{project.name}</div>
                <div className="mt-2 text-sm text-white/55">{project.status}</div>
                <div className="mt-3 text-sm text-white/75">Next: {project.next}</div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Quick actions" description="Fast ways to move the release forward.">
          <div className="grid gap-3 text-sm">
            {[
              ["/projects/new", "Create a new project"],
              ["/manager", "Open Backstage Manager"],
              ["/projects/demo-project", "Open project workspace"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-white/10 px-4 py-3 text-white/75 transition hover:border-white/20 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Vault snapshot" description="Storage and asset system status.">
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 px-4 py-3">7 assets uploaded</div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">2 files still missing</div>
            <div className="rounded-2xl border border-white/10 px-4 py-3">Backstage Vault ready for project linking</div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
