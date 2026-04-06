"use client";

import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  getAutopilotRecommendations,
  getCaptureInboxPreview,
  getCrossSurfaceSignals,
  getEmergencyMode,
  getManagerBrief,
  getPocketExecutionLanes,
  getProjectSprint,
  getReleaseReadiness,
  getTasteBoard,
} from "@/lib/backstage-data";
import {
  mobileMoments,
  mobileOperatingModes,
  mobileTabs,
  quickCaptureActions,
} from "@/lib/pocket-mobile-data";

export default function MobilePage() {
  const { events, projects } = usePocket();
  const activeProject = projects[0];
  const autopilot = getAutopilotRecommendations(activeProject);
  const readiness = getReleaseReadiness(activeProject);
  const sprint = getProjectSprint(activeProject);
  const managerBrief = getManagerBrief(activeProject);
  const captureInbox = getCaptureInboxPreview(projects);
  const crossSurfaceSignals = getCrossSurfaceSignals(projects);
  const executionLanes = getPocketExecutionLanes(projects);
  const emergencyMode = getEmergencyMode(activeProject);
  const recentActivity = events.slice(0, 6).map((event) => ({
    id: event.id,
    projectId: event.projectId,
    projectName: projects.find((project) => project.id === event.projectId)?.name ?? "Room",
    title: event.title,
    kind: event.kind,
    detail: event.detail,
    emphasis: event.emphasis,
  }));
  const tasteBoard = getTasteBoard(activeProject);

  return (
    <AppShell title="Pocket Mobile" eyebrow="Phone-first operator flow">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel
          title="Phone readout"
          description="The mobile surface should give the whole day in one thumb-friendly screen."
        >
          <div className="mx-auto max-w-sm rounded-[2rem] border border-emerald-300/15 bg-[#090c11] p-3 shadow-2xl shadow-black/40">
            <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(8,10,14,0.96))] p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/55">
                <span>Pocket live</span>
                <span>{managerBrief.urgency}</span>
              </div>
              <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                      Active room
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{activeProject.name}</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                    {readiness.score}%
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/70">{activeProject.nextStep}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MobileStat label="Days" value={`${activeProject.daysLeft}`} />
                <MobileStat label="Ready" value={`${readiness.score}%`} />
                <MobileStat label="Risk" value={`${activeProject.missingAssets.length}`} />
              </div>

              <div className="mt-4 space-y-2">
                {sprint.slice(0, 2).map((item) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/65">{item.label}</div>
                    <div className="mt-1 text-sm font-medium text-white">{item.title}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {mobileTabs.slice(0, 4).map((tab) => (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-2 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-white/60"
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Mobile stack" description="The fastest surfaces Pocket should expose on a phone.">
            <div className="grid gap-3 sm:grid-cols-2">
              {quickCaptureActions.map((action) => (
                <div key={action.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{action.title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/60">{action.copy}</div>
                </div>
              ))}
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                <div className="font-medium text-white">Manager brief</div>
                <div className="mt-2 text-sm leading-6 text-white/70">{managerBrief.mainRisk}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Thumb-first triage" description="The phone should tell you the next short chain of moves without opening the full room.">
            <div className="space-y-3 text-sm text-white/70">
              {autopilot.map((item, index) => (
                <Link
                  key={item.title}
                  href={`/projects/${activeProject.id}`}
                  className="block rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4 transition hover:border-emerald-300/25 hover:bg-emerald-300/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/70">Step {index + 1}</div>
                      <div className="mt-2 font-medium text-white">{item.title}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.tone}
                    </div>
                  </div>
                  <div className="mt-3 leading-6 text-white/65">{item.reason}</div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Operating modes" description="How the same app should shift based on where you are.">
            <div className="grid gap-3 md:grid-cols-3">
              {mobileOperatingModes.map((mode) => (
                <div key={mode.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{mode.title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/60">{mode.copy}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Mobile judgment" description="Pocket should still carry creative judgment when you are moving fast.">
            <div className="space-y-3 text-sm text-white/70">
              {tasteBoard.slice(0, 2).map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.verdict}
                    </div>
                  </div>
                  <div className="mt-2 leading-6 text-white/65">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Cross-app awareness" description="What Pocket should know without actually being connected to Mission Control yet.">
            <div className="grid gap-3 md:grid-cols-2">
              {crossSurfaceSignals.map((signal) => (
                <Link
                  key={signal.id}
                  href={`/projects/${signal.id}`}
                  className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{signal.name}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60">
                      {signal.readiness}%
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-white/65">{signal.lane}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Capture lane" description="What should be one tap away when you are moving fast.">
          <div className="space-y-3 text-sm text-white/70">
            {captureInbox.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{item.project}</div>
                <div className="mt-2 leading-6 text-white/60">{item.copy}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent movement" description="The phone should show what changed without making you hunt for it.">
          <div className="space-y-3 text-sm text-white/70">
            {recentActivity.length ? (
              recentActivity.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.projectId}`}
                  className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                        {item.projectName} · {item.kind}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.emphasis}
                    </div>
                  </div>
                  <div className="mt-3 leading-6 text-white/65">{item.detail}</div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-white/45">
                No recent room movement yet.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Mobile moments" description="The lived experience this route is trying to support.">
          <ul className="space-y-3 text-sm text-white/70">
            {mobileMoments.map((moment) => (
              <li key={moment} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 leading-6">
                {moment}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Connected flow" description="The phone route should hand off cleanly between room, manager, capture, and settings.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              ["/dashboard", "Today brief"],
              [`/projects/${activeProject.id}`, "Active room"],
              ["/capture", "Capture"],
              ["/vault", "Vault"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04] hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Execution lanes" description="Pocket should split the day into action lanes, not just show one long feed.">
          <div className="grid gap-4 xl:grid-cols-3">
            {executionLanes.map((lane) => (
              <div key={lane.title} className="rounded-3xl border border-white/10 bg-black/10 px-4 py-4 text-sm text-white/70">
                <div className="font-medium text-white">{lane.title}</div>
                <div className="mt-2 leading-6 text-white/60">{lane.detail}</div>
                <ul className="mt-4 space-y-2">
                  {lane.items.map((item) => (
                    <li key={item} className="rounded-2xl border border-white/10 px-3 py-3 text-white/70">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Emergency mobile mode" description="When the release is slipping, the phone view should get smaller and sharper.">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] text-sm text-white/70">
            <div className="rounded-2xl border border-amber-300/15 bg-amber-200/5 px-4 py-4 text-amber-100/85">
              {emergencyMode.warning}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Must-do only</div>
              <ul className="mt-3 space-y-2 leading-6 text-white/75">
                {emergencyMode.mustDo.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3 text-center">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
