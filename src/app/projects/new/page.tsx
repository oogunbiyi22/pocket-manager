import { AppShell, Panel } from "@/components/app-shell";

export default function NewProjectPage() {
  return (
    <AppShell title="Create project" eyebrow="Start a new release workspace">
      <Panel
        title="Project setup"
        description="The first real flow should let an artist create a project fast, then move straight into Vault, tasks, and manager guidance."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "Project title",
            "Project type",
            "Genre",
            "Target release date",
            "Budget",
            "Rollout goal",
          ].map((label) => (
            <label key={label} className="block text-sm text-white/70">
              <span className="mb-2 block">{label}</span>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white/40">
                Placeholder field
              </div>
            </label>
          ))}
        </div>

        <label className="mt-4 block text-sm text-white/70">
          <span className="mb-2 block">Project description</span>
          <div className="min-h-32 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white/40">
            Notes about the release, campaign, or creative direction.
          </div>
        </label>
      </Panel>
    </AppShell>
  );
}
