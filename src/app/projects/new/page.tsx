import { AppShell, Panel } from "@/components/app-shell";
import {
  getPocketOperatingStates,
  getProjectCreationBlueprint,
  projectTemplates,
  starterWorkspaceOutputs,
} from "@/lib/backstage-data";

export default function NewProjectPage() {
  const blueprint = getProjectCreationBlueprint();
  const operatingStates = getPocketOperatingStates();

  return (
    <AppShell title="Create project" eyebrow="Start a new release workspace">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Project setup"
          description="Fast create flow for a single, EP, album, content campaign, or promo push."
        >
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            {projectTemplates.map((template) => (
              <div key={template.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 p-4 text-sm text-white/75">
                <div className="font-medium text-white">{template.title}</div>
                <div className="mt-2 leading-6 text-white/70">{template.focus}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-200/65">
                  Best for: {template.bestFor}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Project title", "Late Nights"],
              ["Project type", "Single / EP / album / campaign"],
              ["Genre / vibe", "Dark R&B / cinematic / late-night"],
              ["Current stage", "Pre-release / rollout / live"],
              ["Target release date", "May 17"],
              ["Primary goal", "Release on time with a cleaner rollout"],
            ].map(([label, value]) => (
              <label key={label} className="block text-sm text-white/70">
                <span className="mb-2 block">{label}</span>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white/40">
                  {value}
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/65">
              Bring in core assets next: rough master, cover draft, press photos, notes, links.
            </div>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4 text-sm text-white/75">
              After creation, the room should immediately know the project stage, next pressure point, and first checklist.
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/70">
            Pocket should decide the first pressure readout immediately: what is missing, what is risky, what is strong enough to move, and what should not be forced yet.
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Starter outputs" description="The room should feel alive right after create.">
            <ul className="space-y-3 text-sm text-white/70">
              {starterWorkspaceOutputs.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="First upload pack" description="The minimum project materials that make the room useful.">
            <div className="space-y-3 text-sm text-white/70">
              {[
                "Master or rough bounce",
                "Cover draft or visual direction",
                "Notes, lyrics, or rollout angle",
                "Short teaser clip or content reference",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Stage blueprint" description="Creation should adapt based on the room stage, not stay generic.">
            <div className="space-y-3 text-sm text-white/70">
              {blueprint.map((item) => (
                <div key={item.stage} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.stage}</div>
                  <div className="mt-2 leading-6 text-white/60">{item.focus}</div>
                  <ul className="mt-3 space-y-2 text-white/65">
                    {item.checklist.map((check) => (
                      <li key={check}>• {check}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Pocket operating states" description="The create flow should already set up how the mobile product behaves.">
            <div className="space-y-3 text-sm text-white/70">
              {operatingStates.map((item) => (
                <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
