"use client";

import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  getAutopilotStack,
  getDecisionEngine,
  getEmergencyMode,
  getCompanionProfile,
  getCaptureInboxPreview,
  getCrossSurfaceSignals,
  getDailyFocusCards,
  getManagerSnapshot,
  getManagerMemory,
  getOpportunityFeed,
  getPocketSystemSnapshot,
  getPostReleaseMode,
  getProjectMemory,
  getRecentActivity,
  getRevenueBrain,
  getRoomStateBoard,
  getTopThreePriorities,
  getTodayQueue,
  personalSystem,
} from "@/lib/backstage-data";
import { pocketMissionBridge } from "@/lib/pocket-mission-data";
import { mobileMoments, mobileTabs, quickCaptureActions } from "@/lib/pocket-mobile-data";

export default function DashboardPage() {
  const { projects } = usePocket();
  const activeProject = projects[0];
  const snapshot = getManagerSnapshot(projects);
  const todayQueue = getTodayQueue(projects);
  const autopilotStack = getAutopilotStack(projects);
  const blockers = todayQueue.filter((task) => task.blocked);
  const focusCards = getDailyFocusCards(projects);
  const captureInbox = getCaptureInboxPreview(projects);
  const systemSnapshot = getPocketSystemSnapshot(projects);
  const crossSurfaceSignals = getCrossSurfaceSignals(projects);
  const topThree = getTopThreePriorities(projects);
  const managerMemory = getManagerMemory();
  const companion = getCompanionProfile(activeProject);
  const decisionEngine = getDecisionEngine(activeProject);
  const revenueBrain = getRevenueBrain(activeProject);
  const emergencyMode = getEmergencyMode(activeProject);
  const projectMemory = getProjectMemory(activeProject);
  const opportunityFeed = getOpportunityFeed(activeProject);
  const recentActivity = getRecentActivity(projects);
  const roomStateBoard = getRoomStateBoard(projects);
  const postReleaseMode = getPostReleaseMode(activeProject);
  const topStats = [
    { label: "Mode", value: companion.mode.replace(" mode", "") },
    { label: "Today", value: snapshot.dueToday.toString() },
    { label: "Ready", value: `${systemSnapshot.averageReadiness}%` },
  ];

  return (
    <AppShell title="Today" eyebrow="Pocket Manager">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Panel
            title="What matters now"
            description="Start here. Do not overthink the whole system before the next move."
          >
            <div className="space-y-4">
              <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/6 p-5 text-sm leading-7 text-white/80">
                <p>{activeProject.managerNote}</p>
                <p className="mt-4 text-white">
                  <span className="text-emerald-200">Next move:</span> {activeProject.nextStep}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {topStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">{stat.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Decision engine" description="The app should help make the hard calls before the day gets noisy.">
            <div className="space-y-3 text-sm text-white/75">
              {decisionEngine.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/65">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Autopilot stack" description="Pocket should keep the next chain of moves visible without waiting for another prompt.">
            <div className="space-y-3 text-sm text-white/75">
              {autopilotStack.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.projectId}`}
                  className="block rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4 transition hover:border-emerald-300/25 hover:bg-emerald-300/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">
                        {item.projectName} · Step {item.step}
                      </div>
                      <div className="mt-2 font-medium text-white">{item.title}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.tone}
                    </div>
                  </div>
                  <div className="mt-3 leading-6 text-white/70">{item.detail}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/45">{item.reason}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Recent movement" description="The app should immediately show what changed across rooms.">
            <div className="space-y-3 text-sm text-white/75">
              {recentActivity.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.projectId}`}
                  className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                        {item.projectName} · {item.kind}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.emphasis}
                    </div>
                  </div>
                  <div className="mt-3 leading-6 text-white/65">{item.detail}</div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Quick help" description="The fast ways Pocket Manager should help you breathe easier.">
            <div className="space-y-3 text-sm text-white/75">
              {personalSystem.checkIn.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Opportunity feed" description="Pocket should feel proactive, not only reactive.">
            <div className="space-y-3 text-sm text-white/75">
              {opportunityFeed.map((item) => (
                <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Panel title="Top 3 priorities" description="The product should always narrow the day before it expands it.">
            <div className="space-y-3 text-sm text-white/75">
              {topThree.map((item) => (
                <div key={item.rank} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Priority {item.rank}</div>
                      <div className="mt-2 font-medium text-white">{item.title}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.projectName}
                    </div>
                  </div>
                  <div className="mt-3 text-white/65">{item.why}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Today queue" description="The few things that deserve your attention first.">
            <div className="space-y-3 text-sm text-white/75">
              {todayQueue.slice(0, 5).map((task, index) => (
                <Link
                  key={`${task.projectId}-${task.title}`}
                  href={`/projects/${task.projectId}`}
                  className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-white/45">Step {index + 1}</div>
                      <div className="mt-2 font-medium text-white">{task.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-emerald-200/55">
                        {task.projectName} · {task.dueLabel}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {task.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title={pocketMissionBridge.title} description={pocketMissionBridge.summary}>
            <div className="space-y-4 text-sm text-white/75">
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/8 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Shared core</div>
                <ul className="mt-3 space-y-2 leading-6 text-white/75">
                  {pocketMissionBridge.sharedCore.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Pocket priorities</div>
                  <ul className="mt-3 space-y-2 leading-6 text-white/70">
                    {pocketMissionBridge.mobilePriorities.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Mission Control priorities</div>
                  <ul className="mt-3 space-y-2 leading-6 text-white/70">
                    {pocketMissionBridge.desktopPriorities.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Shared system signals</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {crossSurfaceSignals.map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-white/10 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium text-white">{signal.name}</div>
                        <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                          {signal.readiness}%
                        </div>
                      </div>
                      <div className="mt-3 text-white/65">{signal.lane}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-cyan-100/60">
                        {signal.missionView}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Daily focus map" description="A compact read on where pressure is building across active work.">
            <div className="grid gap-3 md:grid-cols-2">
              {focusCards.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.id}`}
                  className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.pressure}
                    </div>
                  </div>
                  <div className="mt-3 text-white/65">{item.nextStep}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.2em] text-amber-100/70">
                    Missing: {item.missing}
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Room state board" description="The system should show how every room is really doing, not just that it exists.">
            <div className="grid gap-3 md:grid-cols-2">
              {roomStateBoard.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${item.id}`}
                  className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-200/65">{item.state}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.readiness}%
                    </div>
                  </div>
                  <div className="mt-3 text-white/65">{item.nextMove}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
                    <span>{item.pressure}</span>
                    <span>{item.blocked} blocked</span>
                  </div>
                  <div className="mt-3 leading-6 text-white/55">{item.continuity}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Watch-outs" description="Only the blockers that could slow you down.">
            <div className="space-y-3 text-sm text-white/75">
              {blockers.length ? (
                blockers.slice(0, 3).map((task) => (
                  <div key={`${task.projectId}-${task.title}`} className="rounded-2xl border border-amber-300/15 bg-amber-200/5 px-4 py-4">
                    <div className="font-medium text-white">{task.title}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.22em] text-amber-100/70">
                      {task.projectName}
                    </div>
                    <div className="mt-3 leading-6 text-amber-100/80">{task.unblock}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 px-4 py-4 text-white/55">
                  No blockers are screaming right now.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Revenue brain" description="Pocket should keep money logic visible while the release is being built.">
            <div className="space-y-3 text-sm text-white/75">
              {revenueBrain.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/65">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Personal AI" description="A customizable companion that can carry part of the creative admin load.">
            <div className="space-y-3 text-sm text-white/75">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                <div className="font-medium text-white">{companion.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                  {companion.role} · {companion.mode}
                </div>
                <div className="mt-3 leading-6 text-white/75">{companion.currentHelp}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Manager memory</div>
                <ul className="mt-3 space-y-2 leading-6 text-white/65">
                  {managerMemory.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel title="Project memory" description="The room should remember what tends to help or hurt this kind of release.">
            <div className="space-y-3 text-sm text-white/75">
              {projectMemory.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Post-release mode" description="Pocket should stay useful after launch day instead of only building up to it.">
            <div className="space-y-3 text-sm text-white/75">
              {postReleaseMode.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/65">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="System posture" description="The pressure readout for the Pocket surface overall.">
            <div className="grid gap-3 sm:grid-cols-3 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Active projects</div>
                <div className="mt-2 text-2xl font-semibold text-white">{systemSnapshot.activeProjects}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Urgent rooms</div>
                <div className="mt-2 text-2xl font-semibold text-white">{systemSnapshot.urgentProjects}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Blocked rooms</div>
                <div className="mt-2 text-2xl font-semibold text-white">{systemSnapshot.blockedProjects}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Where to go next" description="Jump into the part of the app that helps most.">
            <div className="grid gap-3 text-sm">
              <Link href="/manager" className="rounded-2xl border border-white/10 px-4 py-3 text-white/75 transition hover:border-white/20 hover:text-white">
                Open Manager
              </Link>
              <Link href={`/projects/${activeProject.id}`} className="rounded-2xl border border-white/10 px-4 py-3 text-white/75 transition hover:border-white/20 hover:text-white">
                Open active project
              </Link>
              <Link href="/projects" className="rounded-2xl border border-white/10 px-4 py-3 text-white/75 transition hover:border-white/20 hover:text-white">
                View all projects
              </Link>
            </div>
          </Panel>

          <Panel title="Emergency mode" description="When things slip, Pocket should cut the noise and save the release.">
            <div className="space-y-3 text-sm text-white/75">
              <div className="rounded-2xl border border-amber-300/15 bg-amber-200/5 px-4 py-4 text-amber-100/85">
                {emergencyMode.warning}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Must-do only</div>
                <ul className="mt-3 space-y-2 leading-6 text-white/70">
                  {emergencyMode.mustDo.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>

          <Panel title="Phone-first flow" description="How Pocket Manager should feel when it is living on the phone.">
            <div className="space-y-4 text-sm text-white/75">
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Mobile tabs</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mobileTabs.map((tab) => (
                    <span key={tab.label} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65">
                      {tab.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Quick capture actions</div>
                <ul className="mt-3 space-y-3">
                  {quickCaptureActions.map((action) => (
                    <li key={action.title}>
                      <div className="font-medium text-white">{action.title}</div>
                      <div className="mt-1 leading-6 text-white/60">{action.copy}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Capture inbox</div>
                <ul className="mt-3 space-y-3">
                  {captureInbox.map((item) => (
                    <li key={item.title}>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {item.project}
                      </div>
                      <div className="mt-2 leading-6 text-white/60">{item.copy}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Mobile moments</div>
                <ul className="mt-3 space-y-2 leading-6 text-white/65">
                  {mobileMoments.map((moment) => (
                    <li key={moment}>• {moment}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
