"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  projectTemplates,
  onboardingGoals,
  onboardingProfiles,
  onboardingSteps,
  starterWorkspaceOutputs,
} from "@/lib/backstage-data";

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding, profile } = usePocket();
  const [form, setForm] = useState({
    artistName: profile.artistName,
    role: profile.role,
    vibe: profile.vibe,
    currentProject: profile.currentProject,
    targetWindow: profile.targetWindow,
    mainGoal: profile.mainGoal,
  });

  return (
    <AppShell title="Onboarding" eyebrow="Set the manager’s context">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Create your first release workspace"
          description="The first-time flow should get an artist to value in under five minutes."
        >
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            {projectTemplates.slice(0, 4).map((template) => (
              <div key={template.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 p-4 text-sm text-white/75">
                <div className="font-medium text-white">{template.title}</div>
                <div className="mt-2 leading-6 text-white/70">{template.focus}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Artist name", "artistName"],
              ["Primary role", "role"],
              ["Genre / vibe", "vibe"],
              ["Current project", "currentProject"],
              ["Target date or timeframe", "targetWindow"],
              ["Main goal right now", "mainGoal"],
            ].map(([label, key]) => (
              <label key={label} className="block text-sm text-white/70">
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
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {onboardingProfiles.map((profile) => (
              <div key={profile.title} className="rounded-3xl border border-white/10 bg-black/10 p-4">
                <div className="text-sm font-medium text-white">{profile.title}</div>
                <div className="mt-2 text-sm leading-6 text-white/60">{profile.copy}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm leading-6 text-white/70">
            The onboarding should not just collect profile details. It should immediately set up readiness logic, missing-asset logic, first pressure points, and the strongest next move.
          </div>

          <button
            type="button"
            onClick={() => {
              completeOnboarding(form);
              const params = new URLSearchParams({
                name: form.currentProject,
                vibe: form.vibe,
                targetDate: form.targetWindow,
                goal: form.mainGoal,
              });
              router.push(`/projects/new?${params.toString()}`);
            }}
            className="mt-5 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-200"
          >
            Save onboarding and create first room
          </button>
        </Panel>

        <div className="space-y-6">
          <Panel title="Setup flow" description="What the app needs to understand before it can help well.">
            <ol className="space-y-3 text-sm text-white/70">
              {onboardingSteps.map((step, index) => (
                <li key={step} className="rounded-2xl border border-white/10 px-4 py-3">
                  <span className="mr-3 text-emerald-300">0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Priority presets" description="The fastest way to shape the manager around what matters most.">
            <div className="flex flex-wrap gap-2 text-sm">
              {onboardingGoals.map((goal) => (
                <div key={goal} className="rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-2 text-emerald-100">
                  {goal}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="What gets created" description="The onboarding should immediately produce something useful.">
            <ul className="space-y-3 text-sm text-white/70">
              {starterWorkspaceOutputs.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="What gets judged" description="The first-time flow should also tell the truth about what is soft.">
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "What is still missing from the release package",
                "What should not be pushed yet",
                "What kind of rollout template best fits this room",
                "What the first high-leverage move should be",
              ].map((item) => (
                <li key={item} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="What gets preserved" description="The app should set expectations that it remembers beyond one release window.">
            <ul className="space-y-3 text-sm text-white/70">
              {[
                "Which assets became final and where they were actually used",
                "Which rollout angles worked and which ones fell flat",
                "Which contacts, fans, and audience pockets responded",
                "What should carry into post-release mode and the next room",
              ].map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
