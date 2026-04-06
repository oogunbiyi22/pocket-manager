"use client";

import { AgentChatPanel } from "@/components/agent-chat-panel";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { AIVoiceInputDemo } from "@/components/ui/ai-voice-input-demo";
import {
  getAutopilotRecommendations,
  getAudienceOwnershipLayer,
  getCompanionProfile,
  getCompanionActions,
  getDecisionEngine,
  getEmergencyMode,
  getManagerBrief,
  getManagerMemory,
  getManagerOutputConversions,
  getProjectSprint,
  getRecentActivity,
  getRevenueBrain,
  getSongWorld,
  getStudioPipeline,
  getTasteBoard,
  getWhatAmIMissing,
} from "@/lib/backstage-data";

export default function ManagerPage() {
  const { activeProject, convertManagerAction, projects, runManagerComposer } = usePocket();
  const managerBrief = getManagerBrief(activeProject);
  const managerMoves = getProjectSprint(activeProject);
  const managerMemory = getManagerMemory();
  const missing = getWhatAmIMissing(activeProject);
  const companion = getCompanionProfile(activeProject);
  const companionActions = getCompanionActions(activeProject);
  const autopilot = getAutopilotRecommendations(activeProject);
  const tasteBoard = getTasteBoard(activeProject);
  const decisionEngine = getDecisionEngine(activeProject);
  const revenueBrain = getRevenueBrain(activeProject);
  const songWorld = getSongWorld(activeProject);
  const studioPipeline = getStudioPipeline(activeProject);
  const audienceLayer = getAudienceOwnershipLayer(activeProject);
  const emergencyMode = getEmergencyMode(activeProject);
  const outputConversions = getManagerOutputConversions(activeProject);
  const recentActivity = getRecentActivity(projects);
  const managerOutputs = [
    { title: "Next move", detail: managerBrief.bestMove },
    { title: "Main risk", detail: managerBrief.mainRisk },
    { title: "Best prompt", detail: managerBrief.supportPrompt },
  ];
  const quickBriefs = [
    {
      title: "Create today's task",
      intent: "Task" as const,
      brief: `Lock ${activeProject.nextStep.toLowerCase()} today and remove the main blocker.`,
    },
    {
      title: "Draft outreach move",
      intent: "Pitch draft" as const,
      brief: `Write one sharp outreach angle for ${activeProject.name} that feels complete and credible.`,
    },
    {
      title: "Queue content idea",
      intent: "Content item" as const,
      brief: `Turn ${activeProject.name} into one clean mobile-first content beat for this week.`,
    },
    {
      title: "Request missing asset",
      intent: "Asset" as const,
      brief: activeProject.missingAssets[0] ?? "Final rollout asset",
    },
  ];

  return (
    <AppShell title="Pocket Manager" eyebrow="Career guidance engine">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Manager console"
          description="Project-aware guidance that feels like real management, not generic AI chat."
        >
          <div className="space-y-4 text-sm text-white/75">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-5">
              Current project context: {activeProject.name} · {activeProject.stage} · {activeProject.daysLeft} days left
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-5 leading-7">
              {activeProject.managerNote}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Urgency</div>
                <div className="mt-2 text-white">{managerBrief.urgency}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Mode</div>
                <div className="mt-2 text-white">{managerBrief.mode}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Pressure</div>
                <div className="mt-2 text-white">{managerBrief.pressure}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 p-5 text-white/55">
              Prompt ideas: “What should I do this week?” · “Draft playlist outreach.” · “Turn this into a 4-week rollout.”
            </div>
          </div>
        </Panel>

        <Panel title="Voice capture" description="Quickly dump ideas before they disappear.">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4">
            <AIVoiceInputDemo />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Manager behaviors" description="What makes the product useful day one.">
          <ul className="space-y-3 text-sm text-white/70">
            {[
              "Tell the artist what matters most now",
              "Turn ideas into tasks and timeline moves",
              "Point out missing assets before release week panic",
              "Generate content and outreach from project context",
              "Keep the advice calm, sharp, and practical",
            ].map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <AgentChatPanel
            title="Pocket Manager Copilot"
            subtitle="A focused manager workspace for planning, rollout thinking, and next moves."
            companion={companion}
            actions={companionActions}
            onAction={(actionType) => convertManagerAction(activeProject.id, actionType)}
            onCompose={(input) => runManagerComposer(activeProject.id, input)}
          />

          <Panel title="Manager move-set" description="How this surface should convert pressure into action.">
            <div className="space-y-3 text-sm text-white/70">
              {managerMoves.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{item.label}</div>
                  <div className="mt-2 font-medium text-white">{item.title}</div>
                  <div className="mt-2 text-white/60">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Autopilot chain" description="The manager should keep the next three moves organized after every action.">
            <div className="space-y-3 text-sm text-white/70">
              {autopilot.map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Step {index + 1}</div>
                      <div className="mt-2 font-medium text-white">{item.title}</div>
                    </div>
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

          <Panel title="Decision engine" description="Pocket should help make the hard calls, not only repeat the room state.">
            <div className="space-y-3 text-sm text-white/70">
              {decisionEngine.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Active output panel" description="The shape of the advice this page should keep producing.">
            <div className="space-y-3 text-sm text-white/70">
              {managerOutputs.map((item) => (
                <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{item.title}</div>
                  <div className="mt-2 text-white/80">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quick briefs" description="One tap should turn manager thinking into a saved room object.">
            <div className="grid gap-3 md:grid-cols-2 text-sm text-white/70">
              {quickBriefs.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => runManagerComposer(activeProject.id, { intent: item.intent, brief: item.brief })}
                  className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-left transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/65">{item.brief}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Taste engine" description="The product should carry creative judgment, not only logistics.">
            <div className="space-y-3 text-sm text-white/70">
              {tasteBoard.map((item) => (
                <div key={item.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.verdict}
                    </div>
                  </div>
                  <div className="mt-3 leading-6 text-white/75">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Revenue brain" description="Pocket should stay useful under real-world budget pressure.">
            <div className="space-y-3 text-sm text-white/70">
              {revenueBrain.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Companion outputs" description="The personal AI should produce structured outputs, not just chat text.">
            <div className="space-y-3 text-sm text-white/70">
              {companionActions.map((action) => (
                <div key={action.title} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/6 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{action.title}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {action.type}
                    </div>
                  </div>
                  <div className="mt-2 text-white/75">{action.detail}</div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-[12px] text-white/65">
                    {action.payload}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Output conversions" description="The manager should show exactly how advice becomes room objects.">
            <div className="space-y-3 text-sm text-white/70">
              {outputConversions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => convertManagerAction(activeProject.id, item.type)}
                  className="block w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-left transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">
                      {item.type}
                    </div>
                  </div>
                  <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="What am I missing?" description="One of the product’s signature actions should tell the truth fast.">
            <div className="space-y-3 text-sm text-white/70">
              {missing.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-300/15 bg-amber-200/5 px-4 py-3 text-amber-100/85">
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Manager memory" description="The manager should remember patterns and coach from them.">
            <div className="space-y-3 text-sm text-white/70">
              {managerMemory.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Room activity" description="Manager should stay aware of what actually changed in the rooms.">
            <div className="space-y-3 text-sm text-white/70">
              {recentActivity.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
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
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Song-to-world" description="One record should turn into a world, not just a task list.">
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

          <Panel title="Studio pipeline" description="The room should respect the real path from session files to final package.">
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

          <Panel title="Audience ownership" description="Pocket should help build real audience memory, not just broad reach.">
            <div className="space-y-3 text-sm text-white/70">
              {audienceLayer.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-2 leading-6 text-white/70">{item.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Emergency mode" description="When the artist is behind, Pocket should rescue the release instead of adding more noise.">
            <div className="space-y-3 text-sm text-white/70">
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
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-white/70">
                <span className="text-white">Cut:</span> {emergencyMode.cut}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
