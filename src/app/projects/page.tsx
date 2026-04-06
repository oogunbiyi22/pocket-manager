"use client";

import Link from "next/link";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  getDecisionEngine,
  getBlockedTaskCount,
  getOpenTaskCount,
  getPostReleaseMode,
  getProjectTriageBoard,
  getRevenueBrain,
  getReleaseReadiness,
  getRoomStateBoard,
} from "@/lib/backstage-data";

export default function ProjectsPage() {
  const { projects } = usePocket();
  const triageBoard = getProjectTriageBoard(projects);
  const roomStates = getRoomStateBoard(projects);

  return (
    <AppShell title="Projects" eyebrow="Release workspaces">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="Triage board"
          description="The project stack should make pressure, blockers, and the next move obvious."
        >
          <div className="space-y-3 text-sm text-white/70">
            {triageBoard.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.id}`}
                className="block rounded-2xl border border-white/10 bg-black/10 px-4 py-4 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="mt-2 text-white/65">{item.nextMove}</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.readiness}%
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
                  <span>{item.pressure}</span>
                  <span>{item.blockerCount} blockers</span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          title="All projects"
          description="Every release should have one clean operating space for tasks, files, content, outreach, and manager guidance."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {projects.map((project) => {
              const openTasks = getOpenTaskCount(project);
              const blockedTasks = getBlockedTaskCount(project);
              const readiness = getReleaseReadiness(project);
              const decision = getDecisionEngine(project)[0];
              const revenue = getRevenueBrain(project)[0];
              const roomState = roomStates.find((item) => item.id === project.id);
              const followThrough = getPostReleaseMode(project)[0];

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-3xl border border-white/10 bg-black/10 p-5 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-medium text-white">{project.name}</div>
                      <div className="mt-2 text-sm text-white/55">
                        {project.stage}
                        {roomState ? ` · ${roomState.state}` : ""}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">
                      {project.daysLeft}d
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-white/70">{project.goal}</p>
                  <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/5 px-4 py-3 text-sm text-white/75">
                    Next step: {project.nextStep}
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                    <span className="text-white">Decision:</span> {decision.detail}
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/65">
                    <span className="text-white">Money:</span> {revenue.detail}
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/65">
                    <span className="text-white">Follow-through:</span> {followThrough.detail}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/55">
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{openTasks} open tasks</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{blockedTasks} blocked</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{readiness.score}% ready</span>
                    {roomState ? (
                      <span className="rounded-full border border-white/10 px-2.5 py-1">{roomState.pressure}</span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
