"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { useSessionState, clearSessionState } from "@/lib/use-session-state";
import { VoiceRecorder, fileExtensionForMime } from "@/components/voice-recorder";
import { CaptureAssetPlayer } from "@/components/capture-asset-player";
import {
  CAPTURE_FOLDER,
  loadCaptures,
  saveCaptures,
  uploadCaptureFile,
  type PocketItem,
} from "@/lib/captures";

const captureTypes = [
  { label: "Voice memo", icon: "♪" },
  { label: "File", icon: "◻" },
  { label: "Note", icon: "✎" },
  { label: "Task", icon: "⊕" },
  { label: "Link", icon: "⊞" },
  { label: "Photo", icon: "◈" },
] as const;

const isAttachmentType = (t: PocketItem["type"]) => t === "File" || t === "Photo";

export default function CapturePage() {
  const { songs, addSongAssets } = usePocket();
  const [type, setType] = useSessionState<PocketItem["type"]>("pm-capture-type", "Note");
  const [songId, setSongId] = useState(songs[0]?.id ?? "inbox");
  // Draft note survives refresh; cleared once the capture is saved.
  const [body, setBody] = useSessionState("pm-capture-draft", "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PocketItem[]>(() => loadCaptures());

  useEffect(() => {
    saveCaptures(items);
  }, [items]);

  function commitItem(item: PocketItem) {
    setItems((current) => [item, ...current].slice(0, 40));
    setBody("");
    setPendingFile(null);
    clearSessionState("pm-capture-draft");
  }

  function uploadTarget() {
    return songs.some((s) => s.id === songId) ? songId : CAPTURE_FOLDER;
  }

  /**
   * Store a real file, then file the capture. Routed to a song → the asset
   * also lands in that song's room (and the Vault, which reads room assets).
   * If the file can't be stored, no capture is created — a voice memo
   * without audio is exactly the fake this replaces.
   */
  async function storeAndCommit(
    file: Blob,
    fileName: string,
    kind: "memo" | "other" | "artwork",
    label: string,
  ): Promise<boolean> {
    setSaving(true);
    setSaveError(null);
    const target = uploadTarget();
    const asset = await uploadCaptureFile(file, fileName, target, kind);
    setSaving(false);
    if (!asset) {
      setSaveError("Couldn't store that file. Check your connection and that you're signed in, then try again.");
      return false;
    }
    if (target !== CAPTURE_FOLDER) {
      addSongAssets(target, [asset]);
    }
    commitItem({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      body: label,
      songId,
      createdAt: new Date().toISOString(),
      asset,
    });
    return true;
  }

  async function handleRecorded(blob: Blob, durationSeconds: number) {
    const ext = fileExtensionForMime(blob.type);
    await storeAndCommit(blob, `voice-memo-${Date.now()}.${ext}`, "memo", `Voice memo · ${durationSeconds}s`);
  }

  async function saveCapture() {
    if (saving) return;

    if (isAttachmentType(type)) {
      if (!pendingFile) {
        setSaveError(type === "Photo" ? "Choose a photo first — a photo capture needs the actual photo." : "Choose a file first — a file capture needs the actual file.");
        return;
      }
      await storeAndCommit(
        pendingFile,
        pendingFile.name,
        type === "Photo" ? "artwork" : "other",
        body.trim() || pendingFile.name,
      );
      return;
    }

    const cleanBody = body.trim();
    if (!cleanBody) return;
    commitItem({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      body: cleanBody,
      songId,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <AppShell title="Pocket" eyebrow="Fast capture">
      <main className="mx-auto max-w-3xl overflow-hidden rounded-[24px] border-[0.5px] border-white/[0.08] bg-[#141412] text-white">
        <section className="flex items-center justify-between border-b-[0.5px] border-white/10 bg-[#0d0d0b] px-5 py-4">
          <div>
            <div className="text-[15px] font-medium text-white">Pocket</div>
            <div className="mt-1 text-xs text-white/35">Fast capture · route it later</div>
          </div>
          <Link href="/mobile" className="text-2xl font-light text-white/35" aria-label="Close Pocket">
            ×
          </Link>
        </section>

        <section className="grid gap-4 p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {captureTypes.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { setType(item.label); setSaveError(null); }}
                className={`rounded-xl border-[0.5px] px-3 py-4 text-center text-sm ${
                  type === item.label ? "border-[#534ab7] bg-[#534ab7]/20 text-[#7c6fef]" : "border-white/10 bg-[#1e1e1b] text-white/65"
                }`}
              >
                <span className="block text-xl leading-none">{item.icon}</span>
                <span className="mt-2 block text-xs">{item.label}</span>
              </button>
            ))}
          </div>

          {type === "Voice memo" ? (
            <div className="rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4">
              <VoiceRecorder onRecorded={(blob, secs) => void handleRecorded(blob, secs)} />
              {saving && <div className="pb-3 text-center text-xs text-white/50">Storing audio in the vault…</div>}
            </div>
          ) : isAttachmentType(type) ? (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-white/15 bg-[#1e1e1b] px-4 py-10 text-sm text-white/70 transition hover:border-white/30"
              >
                <span className="text-3xl">{type === "Photo" ? "◈" : "◻"}</span>
                <span>{pendingFile ? pendingFile.name : type === "Photo" ? "Choose a photo" : "Choose a file"}</span>
                <span className="text-[11px] text-white/35">Stored in the vault — not just described</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={type === "Photo" ? "image/*" : undefined}
                className="sr-only"
                onChange={(e) => {
                  setPendingFile(e.target.files?.[0] ?? null);
                  setSaveError(null);
                  e.target.value = "";
                }}
              />
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Optional note about this file"
                className="min-h-20 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
              />
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={type === "Link" ? "Paste link or reference" : "Type a note or idea..."}
              className="min-h-32 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
            />
          )}

          <div>
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Route to</div>
            <div className="flex flex-wrap gap-2">
              <RouteChip label="Inbox" active={songId === "inbox"} onClick={() => setSongId("inbox")} />
              {songs.slice(0, 4).map((song) => (
                <RouteChip key={song.id} label={song.title} active={songId === song.id} onClick={() => setSongId(song.id)} />
              ))}
              <RouteChip label="The Vault" active={songId === "vault"} onClick={() => setSongId("vault")} />
            </div>
          </div>

          {saveError && (
            <div className="rounded-xl border-[0.5px] border-[#f05c5c]/40 bg-[#f05c5c]/10 px-4 py-3 text-sm text-[#f05c5c]">
              {saveError}
            </div>
          )}

          {type !== "Voice memo" && (
            <button
              type="button"
              onClick={() => void saveCapture()}
              disabled={saving}
              className="h-[52px] rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "Storing…" : "Pocket it"}
            </button>
          )}
        </section>

        {items.slice(0, 3).length > 0 && (
          <section className="border-b border-white/10 px-5 py-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Recently pocketed</div>
            <div className="space-y-2">
              {items.slice(0, 3).map((item) => {
                const song = songs.find((s) => s.id === item.songId);
                return (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-3 py-2.5 text-sm">
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{item.type}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-white/70">{item.body}</span>
                    {item.asset && <CaptureAssetPlayer asset={item.asset} compact />}
                    <span className="shrink-0 text-[10px] text-white/30">
                      {item.songId === "vault" ? "The Vault" : song?.title ?? "Inbox"}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link href="/vault" className="mt-3 inline-flex text-xs text-white/35">
              View all →
            </Link>
          </section>
        )}

        <section className="bg-[#141412] px-5 py-5 text-white/90">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Inbox</div>
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => {
                const song = songs.find((candidate) => candidate.id === item.songId);

                return (
                  <div key={item.id} className="rounded-xl border-[0.5px] border-white/10 bg-white/5 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-white/90">{item.type}</div>
                      <div className="text-xs text-white/50">{item.songId === "vault" ? "The Vault" : song?.title ?? "Inbox"}</div>
                    </div>
                    <p className="mt-2 leading-6 text-white/60">{item.body}</p>
                    {item.asset && (
                      <div className="mt-3">
                        <CaptureAssetPlayer asset={item.asset} />
                      </div>
                    )}
                    {song ? (
                      <Link href={`/projects/${song.id}`} className="mt-3 inline-flex rounded-lg border-[0.5px] border-white/[0.08] px-3 py-2 text-xs text-white/70">
                        Open Room
                      </Link>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border-[0.5px] border-dashed border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                No captures yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function RouteChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-[0.5px] px-3 py-2 text-xs ${active ? "border-[#534ab7] bg-[#534ab7] text-white" : "border-white/10 bg-[#1e1e1b] text-white/60"}`}
    >
      {label}
    </button>
  );
}
