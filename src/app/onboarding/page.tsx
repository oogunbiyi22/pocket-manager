import { AppShell, Panel } from "@/components/app-shell";

const steps = [
  "Artist name and identity",
  "Role and genre",
  "Goals and release frequency",
  "Budget level and support needs",
];

export default function OnboardingPage() {
  return (
    <AppShell title="Onboarding" eyebrow="Set the manager’s context">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Artist profile setup"
          description="Backstage should learn enough about the artist to give smarter recommendations from day one."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Artist name",
              "Primary role",
              "Genre / lane",
              "Main goal right now",
              "Release frequency",
              "Budget level",
            ].map((label) => (
              <label key={label} className="block text-sm text-white/70">
                <span className="mb-2 block">{label}</span>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white/40">
                  Placeholder input
                </div>
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Why this matters" description="The manager gets sharper when the context is real.">
          <ol className="space-y-3 text-sm text-white/70">
            {steps.map((step, index) => (
              <li key={step} className="rounded-2xl border border-white/10 px-4 py-3">
                <span className="mr-3 text-emerald-300">0{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}
