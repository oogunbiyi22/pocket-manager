"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePocket } from "@/components/pocket-provider";
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
  { label: "Note" as const, icon: "✎" },
  { label: "Task" as const, icon: "⊕" },
  { label: "Link" as const, icon: "⊞" },
  { label: "Voice memo" as const, icon: "♪" },
  { label: "File" as const, icon: "◻" },
  { label: "Photo" as const, icon: "◈" },
] as const;

const isAttachmentType = (t: PocketItem["type"]) => t === "File" || t === "Photo";

export function PocketSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { songs, addSongAssets } = usePocket();
  const [type, setType] = useState<PocketItem["type"]>("Note");
  const [songId, setSongId] = useState(songs[0]?.id ?? "inbox");
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [items, setItems] = useState<PocketItem[]>(() => loadCaptures());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setSaved(false);
        setBody("");
        setPendingFile(null);
        setSaveError(null);
      });
      // small delay so CSS transition fires
      requestAnimationFrame(() => setMounted(true));
    } else {
      queueMicrotask(() => setMounted(false));
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function commitItem(item: PocketItem) {
    const next = [item, ...items].slice(0, 40);
    setItems(next);
    saveCaptures(next);
    setBody("");
    setPendingFile(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  /** Upload target: the routed song, or the shared captures folder. */
  function uploadTarget() {
    return songs.some((s) => s.id === songId) ? songId : CAPTURE_FOLDER;
  }

  /**
   * Store a real file for this capture, then file it. If the capture is
   * routed to a song, the asset also lands in that song's room (and so in
   * the Vault, which reads room assets). Returns false when the file could
   * not be stored — in that case NO capture is created: a voice memo
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

  async function pocket() {
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

    const clean = body.trim();
    if (!clean) return;
    commitItem({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      body: clean,
      songId,
      createdAt: new Date().toISOString(),
    });
  }

  const recent = items.slice(0, 3);
  const canPocket = isAttachmentType(type) ? Boolean(pendingFile) : type === "Voice memo" ? false : Boolean(body.trim());

  if (!open && !mounted) return null;

  return (
    <>
      <style>{`
        @keyframes psBdIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes psBdOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes psSlideIn  { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes psSlideOut { from { transform: translateY(0) } to { transform: translateY(100%) } }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        style={{ animation: `${mounted ? "psBdIn" : "psBdOut"} 0.18s ease both` }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[24px] backdrop-blur-xl bg-[rgba(20,20,18,0.92)] text-white"
        style={{ animation: `${mounted ? "psSlideIn" : "psSlideOut"} 0.28s cubic-bezier(0.16,1,0.3,1) both` }}
      >
        <div className="flex justify-center pt-[10px] pb-1">
          <div className="h-1 w-9 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div>
            <div className="text-[15px] font-medium">Pocket</div>
            <div className="text-xs text-white/35">Fast capture · route it later</div>
          </div>
          <button type="button" onClick={onClose} className="text-2xl font-light text-white/30" aria-label="Close Pocket">
            ×
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="grid gap-4 p-5">
            {/* Type picker */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {captureTypes.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setType(item.label); setSaveError(null); }}
                  className={`rounded-xl border-[0.5px] px-2 py-3 text-center text-sm ${
                    type === item.label
                      ? "border-[#534ab7] bg-[#eeedfe] text-[#534ab7]"
                      : "border-white/10 bg-[#1e1e1b] text-white/65"
                  }`}
                >
                  <span className="block text-lg leading-none">{item.icon}</span>
                  <span className="mt-1.5 block text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Input area */}
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
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-white/15 bg-[#1e1e1b] px-4 py-8 text-sm text-white/70 transition hover:border-white/30"
                >
                  <span className="text-2xl">{type === "Photo" ? "◈" : "◻"}</span>
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
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Optional note about this file"
                  className="min-h-16 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
                />
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  type === "Link" ? "Paste link or reference"
                  : "Type a note or idea..."
                }
                className="min-h-24 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
              />
            )}

            {/* Route chips */}
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Route to</div>
              <div className="flex flex-wrap gap-2">
                {[{ id: "inbox", title: "Inbox" }, ...songs.slice(0, 4), { id: "vault", title: "The Vault" }].map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setSongId(dest.id)}
                    className={`rounded-full border-[0.5px] px-3 py-2 text-xs ${
                      songId === dest.id
                        ? "border-[#534ab7] bg-[#534ab7] text-white"
                        : "border-white/10 bg-[#1e1e1b] text-white/60"
                    }`}
                  >
                    {dest.title}
                  </button>
                ))}
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
                onClick={() => void pocket()}
                disabled={!canPocket || saving}
                className="h-[52px] rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? "Storing…" : saved ? "Pocketed ✓" : "Pocket it"}
              </button>
            )}
            {type === "Voice memo" && saved && (
              <div className="text-center text-sm text-[#97c459]">Pocketed ✓</div>
            )}
          </div>

          {recent.length > 0 && (
            <div className="border-t border-white/10 px-5 py-4">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Recently pocketed</div>
              <div className="space-y-2">
                {recent.map((item) => {
                  const song = songs.find((s) => s.id === item.songId);
                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-3 py-2.5">
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">{item.type}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-white/70">{item.body}</span>
                      {item.asset && <CaptureAssetPlayer asset={item.asset} compact />}
                      <span className="shrink-0 text-[10px] text-white/30">
                        {song?.title ?? (item.songId === "vault" ? "The Vault" : "Inbox")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/vault" onClick={onClose} className="mt-3 inline-flex text-xs text-white/35">
                View all in Vault →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
