"use client";

import { useState } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
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
  const { profile, signedIn, signOut, updateProfile } = usePocket();
  const [form, setForm] = useState({
    artistName: profile.artistName,
    role: profile.role,
    vibe: profile.vibe,
    currentProject: profile.currentProject,
    targetWindow: profile.targetWindow,
    mainGoal: profile.mainGoal,
    managerMode: profile.managerMode,
  });

  return (
    <AppShell title="Settings" eyebrow="Profile and preferences">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Artist defaults" description="Profile, goals, and planning defaults that shape recommendations.">
          <div className="space-y-4 text-sm text-white/70">
            {[
              ["Artist name", "artistName"],
              ["Primary role", "role"],
              ["Genre / vibe", "vibe"],
              ["Current project", "currentProject"],
              ["Target window", "targetWindow"],
              ["Main goal", "mainGoal"],
            ].map(([label, key]) => (
              <label key={label} className="block">
                <span className="mb-2 block">{label}</span>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300/25"
                />
              </label>
            ))}

            <label className="block">
              <span className="mb-2 block">Manager mode</span>
              <select
                value={form.managerMode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    managerMode: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300/25"
              >
                {managerBehaviorModes.map((mode) => (
                  <option key={mode.title} value={mode.title} className="bg-[#0a0a0f]">
                    {mode.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateProfile(form)}
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-200"
              >
                Save settings
              </button>
              {signedIn ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/85 transition hover:border-white/30 hover:text-white"
                >
                  Sign out
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
              Active profile: {profile.artistName} · {profile.role} · {profile.managerMode}
            </div>

            <div className="space-y-3">
              {artistDefaults.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/60">{item.detail}</div>
                </div>
              ))}
            </div>
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

          <Panel title="Continuity rules" description="Pocket should function as long-term artist memory, not only launch prep.">
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "Keep post-release follow-up visible instead of dropping the room after launch day.",
                "Preserve what assets were used, what worked, and what should carry into the next campaign.",
                "Let project memory become career memory over time.",
              ].map((rule) => (
                <li key={rule} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  {rule}
                </li>
              ))}
            </ul>
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
