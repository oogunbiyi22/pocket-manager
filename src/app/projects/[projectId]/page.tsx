import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell, Panel } from "@/components/app-shell";
import {
  getAssetActionLinks,
  getAudienceOwnershipLayer,
  getCollaborationPockets,
  getContentStatusBoard,
  getEmergencyMode,
  getManagerBrief,
  getBlockedTaskCount,
  getOpportunityFeed,
  getProjectMemory,
  getReleaseRiskReport,
  getRevenueBrain,
  getProjectDecisionBoard,
  getProjectExecutionChecklist,
  getOpenTaskCount,
  getProjectById,
  getProjectSprint,
  getProjectTimeline,
  getReleaseReadiness,
  getSongWorld,
  getStudioPipeline,
  getTasteBoard,
  projects,
} from "@/lib/backstage-data";

export function generateStaticParams() {
  return projects.map((project) => ({ projectId: project.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProjectById(projectId);

  if (!project) {
    notFound();
  }

  const timeline = getProjectTimeline(project);
  const openTasks = getOpenTaskCount(project);
  const blockedTasks = getBlockedTaskCount(project);
  const readiness = getReleaseReadiness(project);
  const sprint = getProjectSprint(project);
  const managerBrief = getManagerBrief(project);
  const executionChecklist = getProjectExecutionChecklist(project);
  const decisionBoard = getProjectDecisionBoard(project);
  const tasteBoard = getTasteBoard(project);
  const contentBoard = getContentStatusBoard(project);
  const revenueBrain = getRevenueBrain(project);
  const riskReport = getReleaseRiskReport(project);
  const songWorld = getSongWorld(project);
  const studioPipeline = getStudioPipeline(project);
  const audienceLayer = getAudienceOwnershipLayer(project);
  const emergencyMode = getEmergencyMode(project);
  const projectMemory = getProjectMemory(project);
  const opportunityFeed = getOpportunityFeed(project);
  const assetLinks = getAssetActionLinks(project);
  const collaborationPockets = getCollaborationPockets(project);

  return (
    <AppShell title={project.name} eyebrow={`${project.type} · ${project.stage}`}>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04] hover:text-white"
        >
          Back to today brief
        </Link>
        <Link
          href="/manager"
          className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04] hover:text-white"
        >
          Open manager
        </Link>
        <Link
          href="/mobile"
          className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04] hover:text-white"
        >
          Open mobile flow
        </Link>
        <Link
          href="/projects"
          className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04] hover:text-white"
        >
          View all rooms
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Release readout"
          description="The point of this room is to make the next move obvious."
        >
          <div className="space-y-4 text-sm text-white/75">
            <p className="rounded-3xl border border-emerald-300/15 bg-emerald-300/6 p-5 leading-7">
              {project.summary}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Days left" value={`${project.daysLeft}`} />
              <Stat label="Open tasks" value={`${openTasks}`} />
              <Stat label="Readiness" value={`${readiness.score}%`} />
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <div className="text-xs uppercase tracking-[0.25em] text-emerald-200/70">
                Manager note
              </div>
              <p className="mt-3 leading-7">{project.managerNote}</p>
              <p className="mt-4 text-white">
                <span className="text-emerald-200">Next step:</span> {project.nextStep}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Timeline" description="Reduce drag before the release window gets tighter.">
          <div className="space-y-3 text-sm text-white/75">
            {timeline.map((step) => (
              <div key={step.label} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">{step.label}</div>
                <div className="mt-2 font-medium text-white">{step.title}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Priorities" description="What has to move for the release to feel real.">
          <ul className="space-y-3 text-sm text-white/70">
            {project.priorities.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Release readiness" description="The parts of the release package that are solid or still soft.">
          <div className="space-y-3 text-sm text-white/70">
            {readiness.items.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border px-4 py-4 ${
                  item.status === "Ready"
                    ? "border-emerald-300/15 bg-emerald-300/6"
                    : "border-amber-300/15 bg-amber-200/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-white">{item.label}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">{item.status}</div>
                </div>
                <div className="mt-2 text-white/70">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Files and assets" description="What exists and what still needs attention.">
          <div className="space-y-3 text-sm text-white/70">
            {project.assets.map((asset) => (
              <div key={asset.name} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                <div className="font-medium text-white">{asset.name}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">
                  {asset.type} · {asset.status}
                </div>
              </div>
            ))}
            {project.missingAssets.map((asset) => (
              <div key={asset} className="rounded-2xl border border-amber-300/15 bg-amber-200/5 px-4 py-3 text-amber-100/80">
                Missing: {asset}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Tasks and outreach" description="Execution surface for the current lane.">
          <div className="space-y-4 text-sm text-white/70">
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <div key={task.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{task.title}</div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      {task.status}
                    </div>
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">
                    {task.lane} · {task.dueLabel} · {task.energy}
                  </div>
                  {task.blocked && task.unblock ? (
                    <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-200/5 px-3 py-2 text-amber-100/80">
                      Unblock: {task.unblock}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">
                Outreach stack
              </div>
              <ul className="mt-3 space-y-2">
                {project.outreach.map((contact) => (
                  <li key={contact.name}>
                    {contact.name} · {contact.type} · {contact.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="7-day sprint" description="The compact push sequence that should move this room forward.">
          <div className="space-y-3 text-sm text-white/70">
            {sprint.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{item.label}</div>
                <div className="mt-2 font-medium text-white">{item.title}</div>
                <div className="mt-2 text-white/60">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Manager brief" description="The distilled readout this room should keep giving back.">
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Urgency</div>
              <div className="mt-2 text-white">{managerBrief.urgency}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Main risk</div>
              <div className="mt-2 text-white/75">{managerBrief.mainRisk}</div>
            </div>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Support prompt</div>
              <div className="mt-2 text-white/80">{managerBrief.supportPrompt}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Blocked count</div>
              <div className="mt-2 text-white">{blockedTasks}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Release risk report" description="One tap should tell the artist what could make the release underperform.">
          <div className="space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-amber-300/15 bg-amber-200/5 px-4 py-4 text-amber-100/85">
              {riskReport.headline}
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Fix first</div>
              <div className="mt-2 text-white/80">{riskReport.fixFirst}</div>
            </div>
            {riskReport.items.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.level}
                  </div>
                </div>
                <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Content status board" description="Ideas should turn into a visible content flow instead of staying vague.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contentBoard.map((item) => (
              <div key={item.status} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm text-white/70">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{item.status}</div>
                <div className="mt-2 font-medium text-white">{item.title}</div>
                <div className="mt-2 leading-6 text-white/65">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Execution checklist" description="The room should turn pressure into ordered moves, not just a pile of tasks.">
          <div className="space-y-3 text-sm text-white/70">
            {executionChecklist.map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Step {item.step}</div>
                    <div className="mt-2 font-medium text-white">{item.title}</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.status}
                  </div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">{item.owner}</div>
                <div className="mt-3 text-white/60">{item.note}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Decision board" description="The product should help the artist decide where to push and where not to drift.">
          <div className="space-y-3 text-sm text-white/70">
            {decisionBoard.map((item) => (
              <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-2 leading-6 text-white/75">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Taste engine" description="The room should judge quality and strength, not only track tasks.">
          <div className="space-y-3 text-sm text-white/70">
            {tasteBoard.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.verdict}
                  </div>
                </div>
                <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Song world" description="Translate the record into a clearer outward-facing world.">
          <div className="space-y-3 text-sm text-white/70">
            {[
              ["Visual direction", songWorld.visual],
              ["Pitch angle", songWorld.pitch],
              ["Caption tone", songWorld.caption],
              ["Rollout feel", songWorld.rollout],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{label}</div>
                <div className="mt-2 leading-6 text-white/75">{detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <Panel title="Studio pipeline" description="Keep the real audio workflow visible inside the room.">
          <div className="space-y-3 text-sm text-white/70">
            {studioPipeline.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.status}
                  </div>
                </div>
                <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Revenue brain" description="The room should keep money logic visible, not only release logic.">
          <div className="space-y-3 text-sm text-white/70">
            {revenueBrain.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Audience ownership" description="Start building an owned audience memory, not just a promo blast.">
          <div className="space-y-3 text-sm text-white/70">
            {audienceLayer.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Asset-to-action links" description="Every file should explain what room move it supports and whether it is actually being used.">
          <div className="space-y-3 text-sm text-white/70">
            {assetLinks.map((item) => (
              <div key={item.asset} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-white">{item.asset}</div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.status}
                  </div>
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">{item.project}</div>
                <div className="mt-3 text-white/75">
                  <span className="text-white">Tied to:</span> {item.tiedTo}
                </div>
                <div className="mt-2 leading-6 text-white/65">{item.usage}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Collaboration pockets" description="Track outside help lightly without turning the room into team software.">
          <div className="space-y-3 text-sm text-white/70">
            {collaborationPockets.map((item) => (
              <div key={item.role} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{item.role}</div>
                    <div className="mt-2 font-medium text-white">{item.name}</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.status}
                  </div>
                </div>
                <div className="mt-3 leading-6 text-white/65">{item.note}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Opportunity feed" description="The room should expose timing windows and leverage points clearly.">
          <div className="space-y-3 text-sm text-white/70">
            {opportunityFeed.map((item) => (
              <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                <div className="font-medium text-white">{item.title}</div>
                <div className="mt-2 leading-6 text-white/75">{item.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Project memory" description="This room should remember what patterns actually help releases like this move.">
          <div className="space-y-3 text-sm text-white/70">
            {projectMemory.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Emergency mode" description="If the release is slipping, Pocket should rescue the room with a smaller and sharper path.">
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr] text-sm text-white/70">
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
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/70">
                <span className="text-white">Cut:</span> {emergencyMode.cut}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
