"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import {
  getAutopilotRecommendations,
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
  getRecentActivity,
  getReleaseReadiness,
  getSongWorld,
  getStudioPipeline,
  getTasteBoard,
} from "@/lib/backstage-data";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const {
    addAsset,
    addOutreachContact,
    addQuickAsset,
    addQuickContentIdea,
    addTask,
    projects,
    resolveMissingAsset,
    setActiveProject,
    uploadAssets,
    updateOutreachStatus,
    updateTaskStatus,
  } = usePocket();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const project = getProjectById(projectId, projects);

  if (!project) {
    notFound();
  }

  const timeline = getProjectTimeline(project);
  const autopilot = getAutopilotRecommendations(project);
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
  const roomActivity = getRecentActivity([project]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    lane: "Create" as const,
    dueLabel: "Today",
    energy: "Light" as const,
  });
  const [assetForm, setAssetForm] = useState({
    name: "",
    type: "Artwork",
    status: "Draft",
  });
  const [outreachForm, setOutreachForm] = useState({
    name: "",
    type: "Playlist",
    status: "Draft",
  });
  const [vaultStatus, setVaultStatus] = useState("Uploaded");

  return (
    <AppShell title={project.name} eyebrow={`${project.type} · ${project.stage}`}>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
        <button
          type="button"
          onClick={() => setActiveProject(project.id)}
          className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-4 text-left text-emerald-100 transition hover:border-emerald-300/35"
        >
          Make active room
        </button>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Recent room movement" description="The room should immediately show what actually changed.">
          <div className="space-y-3 text-sm text-white/75">
            {roomActivity.length ? (
              roomActivity.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-200/70">
                        {item.kind}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.emphasis}
                    </div>
                  </div>
                  <div className="mt-3 leading-6 text-white/65">{item.detail}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 px-4 py-4 text-white/45">
                No room movement yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Immediate next actions" description="Keep the room narrow enough to move without drifting.">
          <div className="space-y-3 text-sm text-white/75">
            {autopilot.map((item, index) => (
              <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-white">Step {index + 1}: {item.title}</div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                    {item.tone}
                  </div>
                </div>
                <div className="mt-3 leading-6 text-white/70">{item.detail}</div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-white/45">{item.reason}</div>
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
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-medium text-white">Vault drop</div>
                  <div className="mt-2 leading-6 text-white/65">
                    Add local files into this room now. They persist as uploaded asset records on this device.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={vaultStatus}
                    onChange={(event) => setVaultStatus(event.target.value)}
                    className="rounded-full border border-white/10 bg-[#0a0a0f] px-4 py-2 text-sm text-white outline-none"
                  />
                  <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-200">
                    Add files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const files = Array.from(event.target.files ?? []);

                        if (!files.length) {
                          return;
                        }

                        uploadAssets(
                          project.id,
                          files.map((file) => ({
                            name: file.name,
                            sizeLabel: formatFileSize(file.size),
                            type: inferUploadType(file.type, file.name),
                            status: vaultStatus,
                          })),
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
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
                <div>Missing: {asset}</div>
                <button
                  type="button"
                  onClick={() => resolveMissingAsset(project.id, asset)}
                  className="mt-3 rounded-full border border-amber-100/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-50 transition hover:border-amber-100/35"
                >
                  Mark resolved
                </button>
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["To do", "In progress", "Done"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateTaskStatus(project.id, task.title, status)}
                        className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] transition ${
                          task.status === status
                            ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                            : "border-white/10 text-white/55 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">
                Outreach stack
              </div>
              <ul className="mt-3 space-y-2">
                {project.outreach.map((contact) => (
                  <li key={contact.name} className="rounded-2xl border border-white/10 px-3 py-3">
                    <div className="text-white">
                      {contact.name} · {contact.type} · {contact.status}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["Draft", "Sent", "Follow-up due", "Replied"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateOutreachStatus(project.id, contact.name, status)}
                          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] transition ${
                            contact.status === status
                              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                              : "border-white/10 text-white/55 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
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

      <div className="mt-6">
        <Panel title="Quick room controls" description="The room should let the artist create momentum fast, not only inspect the situation.">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
              <div className="font-medium text-white">Add task</div>
              <div className="mt-2 leading-6 text-white/60">Push a real next move into the room.</div>
              <input
                value={taskForm.title}
                onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Approve cover alt"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/25"
              />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <select
                  value={taskForm.lane}
                  onChange={(event) => setTaskForm((current) => ({ ...current, lane: event.target.value as typeof current.lane }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                >
                  {["Create", "Admin", "Promo", "Personal"].map((item) => (
                    <option key={item} value={item} className="bg-[#0a0a0f]">
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  value={taskForm.dueLabel}
                  onChange={(event) => setTaskForm((current) => ({ ...current, dueLabel: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                />
                <select
                  value={taskForm.energy}
                  onChange={(event) => setTaskForm((current) => ({ ...current, energy: event.target.value as typeof current.energy }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                >
                  {["Light", "Medium", "Heavy"].map((item) => (
                    <option key={item} value={item} className="bg-[#0a0a0f]">
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!taskForm.title.trim()) return;
                  addTask(project.id, taskForm);
                  setTaskForm({ title: "", lane: "Create", dueLabel: "Today", energy: "Light" });
                }}
                className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-200"
              >
                Save task
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
              <div className="font-medium text-white">Add asset</div>
              <div className="mt-2 leading-6 text-white/60">Log a real file or package state into the room.</div>
              <input
                value={assetForm.name}
                onChange={(event) => setAssetForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="late-nights-cover-final.png"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/25"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={assetForm.type}
                  onChange={(event) => setAssetForm((current) => ({ ...current, type: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                />
                <input
                  value={assetForm.status}
                  onChange={(event) => setAssetForm((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addQuickAsset(project.id, "Fresh teaser clip")}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Quick teaser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!assetForm.name.trim()) return;
                    addAsset(project.id, assetForm);
                    setAssetForm({ name: "", type: "Artwork", status: "Draft" });
                  }}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-200"
                >
                  Save asset
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-white/75">
              <div className="font-medium text-white">Add outreach lead</div>
              <div className="mt-2 leading-6 text-white/60">Keep contact motion inside the room.</div>
              <input
                value={outreachForm.name}
                onChange={(event) => setOutreachForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Night Shift Playlist"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/25"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={outreachForm.type}
                  onChange={(event) => setOutreachForm((current) => ({ ...current, type: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                />
                <input
                  value={outreachForm.status}
                  onChange={(event) => setOutreachForm((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-3 py-3 text-white outline-none"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addQuickContentIdea(project.id, "Quick post-release reaction prompt")}
                  className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Queue content angle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!outreachForm.name.trim()) return;
                    addOutreachContact(project.id, outreachForm);
                    setOutreachForm({ name: "", type: "Playlist", status: "Draft" });
                  }}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-200"
                >
                  Save lead
                </button>
              </div>
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

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function inferUploadType(mimeType: string, fileName: string) {
  if (mimeType.startsWith("image/")) {
    return "Artwork";
  }

  if (mimeType.startsWith("video/")) {
    return "Video";
  }

  if (mimeType.startsWith("audio/")) {
    return "Audio";
  }

  if (/cover|art|photo|visual/i.test(fileName)) {
    return "Artwork";
  }

  return "Document";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
