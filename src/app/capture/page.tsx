"use client";

import { ChangeEvent, useState } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { getCaptureInboxPreview, getManagerBrief } from "@/lib/backstage-data";

export default function CapturePage() {
  const { activeProject, addQuickContentIdea, addQuickAsset, addTask, uploadAssets } = usePocket();
  const managerBrief = getManagerBrief(activeProject);
  const captureInbox = getCaptureInboxPreview([activeProject]);
  const [quickTask, setQuickTask] = useState("");
  const [voiceNotes, setVoiceNotes] = useState<Array<{ duration: number; createdAt: string }>>([]);
  const [captureStatus, setCaptureStatus] = useState("Captured");

  return (
    <AppShell title="Capture" eyebrow="Fast input lane">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="One-tap capture"
          description="This route should let ideas land fast without forcing the user through the full manager page."
        >
          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-300/6 p-4 text-sm text-white/75">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Active room</div>
              <div className="mt-2 text-lg font-medium text-white">{activeProject.name}</div>
              <div className="mt-2 leading-6 text-white/65">{managerBrief.bestMove}</div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div className="text-sm font-medium text-white">Quick task</div>
              <div className="mt-2 text-sm leading-6 text-white/60">
                Drop the next move into the active room before it disappears.
              </div>
              <input
                value={quickTask}
                onChange={(event) => setQuickTask(event.target.value)}
                placeholder="Send revised cover options to designer"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-300/25"
              />
              <button
                type="button"
                onClick={() => {
                  if (!quickTask.trim()) return;
                  addTask(activeProject.id, {
                    title: quickTask.trim(),
                    lane: "Admin",
                    dueLabel: "Today",
                    energy: "Light",
                  });
                  setQuickTask("");
                }}
                className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-200"
              >
                Save to today
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div className="text-sm font-medium text-white">Voice note</div>
              <div className="mt-2 text-sm leading-6 text-white/60">
                Capture a rough thought now and convert it into a room artifact later.
              </div>
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <AIVoiceInput
                  onStop={(duration) => {
                    if (duration <= 0) return;
                    setVoiceNotes((current) => [
                      { duration, createdAt: new Date().toISOString() },
                      ...current,
                    ].slice(0, 4));
                    addQuickContentIdea(activeProject.id, `Voice note captured (${duration}s): turn this into the next rollout move.`);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => addQuickAsset(activeProject.id, "Reference cover draft")}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-left text-sm text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
              >
                <div className="font-medium text-white">Quick asset drop</div>
                <div className="mt-2 text-white/60">Save a placeholder for the next visual or file handoff.</div>
              </button>
              <button
                type="button"
                onClick={() => addQuickContentIdea(activeProject.id, "Captured from phone: one-line teaser angle")}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-left text-sm text-white/75 transition hover:border-emerald-300/20 hover:bg-white/[0.04]"
              >
                <div className="font-medium text-white">Quick idea</div>
                <div className="mt-2 text-white/60">Save a content angle straight into the room memory.</div>
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Fast file capture</div>
                  <div className="mt-2 text-sm leading-6 text-white/60">
                    Drop a phone file straight into the active room vault without leaving capture mode.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={captureStatus}
                    onChange={(event) => setCaptureStatus(event.target.value)}
                    className="rounded-full border border-white/10 bg-[#0a0a0f] px-4 py-2 text-sm text-white outline-none"
                  />
                  <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-200">
                    Capture files
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
                          activeProject.id,
                          files.map((file) => ({
                            name: file.name,
                            sizeLabel: formatFileSize(file.size),
                            type: inferUploadType(file.type, file.name),
                            status: captureStatus,
                          })),
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Capture inbox" description="Pocket should show what fast capture is trying to feed, not just a blank form.">
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

          <Panel title="Recent voice notes" description="Even before transcription exists, the route should preserve the capture event.">
            {voiceNotes.length ? (
              <div className="space-y-3 text-sm text-white/70">
                {voiceNotes.map((note, index) => (
                  <div key={`${note.createdAt}-${index}`} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                    <div className="font-medium text-white">Voice capture saved</div>
                    <div className="mt-2 text-white/60">
                      {note.duration}s · {new Date(note.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-white/45">
                No voice captures yet.
              </div>
            )}
          </Panel>
        </div>
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
