import { AppShell, Panel } from "@/components/app-shell";

const tabs = ["Overview", "Vault", "Tasks", "Promo", "Budget", "Notes"];

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <AppShell title="Project workspace" eyebrow={`Project: ${projectId}`}>
      <div className="mb-6 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <div
            key={tab}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65"
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Overview"
          description="This shell is where the release dashboard, readiness score, next actions, and asset state will live."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Release readiness score",
              "Next recommended move",
              "Missing assets",
              "Rollout snapshot",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/10 p-5 text-sm text-white/70">
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Backstage Manager"
          description="The manager should stand out here — giving real guidance, pressure, and decision support."
        >
          <div className="space-y-3 text-sm text-white/75">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4">
              You are close, but this release still needs visuals before promo starts.
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              Strong move next: upload your hero assets into Backstage Vault, then generate a pitch pack.
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Vault", "Audio, artwork, videos, docs, and backup storage"],
          ["Tasks", "Auto-generated release checklist and custom tasks"],
          ["Promo", "Pitch generator, outreach tracking, and content planning"],
          ["Budget", "Smart money-to-action recommendations"],
        ].map(([title, copy]) => (
          <Panel key={title} title={title} description={copy} />
        ))}
      </div>
    </AppShell>
  );
}
