import { AppShell, Panel } from "@/components/app-shell";

export default function ManagerPage() {
  return (
    <AppShell title="Backstage Manager" eyebrow="Career guidance engine">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Manager console"
          description="This shell is where the motivating, strategic, project-aware manager experience will live."
        >
          <div className="space-y-4 text-sm text-white/75">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-5">
              Ask the manager what to do next, whether a release is ready, what to spend money on, or how to stop a rollout from stalling.
            </div>
            <div className="rounded-2xl border border-white/10 p-5 text-white/45">
              Prompt box placeholder
            </div>
          </div>
        </Panel>

        <Panel title="Manager behaviors" description="These are the standout responsibilities of the system.">
          <ul className="space-y-3 text-sm text-white/70">
            {[
              "Decision support",
              "Motivation with direction",
              "Accountability nudges",
              "Career recommendations",
              "Project-aware next steps",
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
