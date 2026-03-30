import { AppShell, Panel } from "@/components/app-shell";
import {
  artistDefaults,
  companionSystemRules,
  getPocketOperatingStates,
  managerBehaviorModes,
  pocketMoatLayers,
  pocketSystemRules,
} from "@/lib/backstage-data";

export default function SettingsPage() {
  const operatingStates = getPocketOperatingStates();

  return (
    <AppShell title="Settings" eyebrow="Profile and preferences">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Artist defaults" description="Profile, goals, and planning defaults that shape recommendations.">
          <div className="space-y-3 text-sm text-white/70">
            {artistDefaults.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 px-4 py-4">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-2 leading-6 text-white/60">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Manager behavior" description="How the manager should support the artist.">
            <div className="space-y-3 text-sm text-white/70">
              {managerBehaviorModes.map((mode) => (
                <div key={mode.title} className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="font-medium text-white">{mode.title}</div>
                  <div className="mt-2 leading-6 text-white/60">{mode.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Pocket rules" description="Non-negotiables for how this product should behave.">
            <ul className="space-y-3 text-sm text-white/70">
              {pocketSystemRules.map((rule) => (
                <li key={rule} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-3">
                  {rule}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Moat layers" description="The product should never drift away from the real advantage stack.">
            <ul className="space-y-3 text-sm text-white/70">
              {pocketMoatLayers.map((layer) => (
                <li key={layer} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  {layer}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Operating states" description="The mobile product should adapt to the user’s context, not just look different.">
            <div className="space-y-3 text-sm text-white/70">
              {operatingStates.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/60">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Companion rules" description="The personal AI should feel premium, respectful, and trusted.">
            <ul className="space-y-3 text-sm text-white/70">
              {companionSystemRules.map((rule) => (
                <li key={rule} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-3">
                  {rule}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
