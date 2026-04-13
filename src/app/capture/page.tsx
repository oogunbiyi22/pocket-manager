"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

type PocketItem = {
  id: string;
  type: "Voice memo" | "File" | "Note" | "Task" | "Link" | "Photo";
  body: string;
  songId: string;
  createdAt: string;
};

const CAPTURE_STORAGE_KEY = "pocket-manager-captures";
const captureTypes = [
  { label: "Voice memo", icon: "♪" },
  { label: "File", icon: "◻" },
  { label: "Note", icon: "✎" },
  { label: "Task", icon: "⊕" },
  { label: "Link", icon: "⊞" },
  { label: "Photo", icon: "◈" },
] as const;

export default function CapturePage() {
  const { songs } = usePocket();
  const [type, setType] = useState<PocketItem["type"]>("Note");
  const [songId, setSongId] = useState(songs[0]?.id ?? "inbox");
  const [body, setBody] = useState("");
  const [items, setItems] = useState<PocketItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(CAPTURE_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as PocketItem[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(CAPTURE_STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function saveCapture() {
    const cleanBody = body.trim();

    if (!cleanBody) {
      return;
    }

    setItems((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        body: cleanBody,
        songId,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 40));
    setBody("");
  }

  return (
    <AppShell title="Pocket" eyebrow="Fast capture">
      <main className="mx-auto max-w-3xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#141412] text-white">
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
                onClick={() => setType(item.label)}
                className={`rounded-xl border-[0.5px] px-3 py-4 text-center text-sm ${
                  type === item.label ? "border-[#534ab7] bg-[#eeedfe] text-[#534ab7]" : "border-white/10 bg-[#1e1e1b] text-white/65"
                }`}
              >
                <span className="block text-xl leading-none">{item.icon}</span>
                <span className="mt-2 block text-xs">{item.label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={type === "Link" ? "Paste link or reference" : type === "File" ? "Describe the file you need to attach" : "Type a note or idea..."}
            className="min-h-32 rounded-xl border-[0.5px] border-white/10 bg-[#1e1e1b] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30"
          />

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

          <button type="button" onClick={saveCapture} className="h-[52px] rounded-xl bg-white px-5 py-3 text-sm font-medium text-[#0d0d0b]">
            Pocket it
          </button>
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
                    <span className="shrink-0 text-[10px] text-white/30">{song?.title ?? "Inbox"}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/vault" className="mt-3 inline-flex text-xs text-white/35">
              View all →
            </Link>
          </section>
        )}

        <section className="bg-white px-5 py-5 text-[#111]">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Inbox</div>
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => {
                const song = songs.find((candidate) => candidate.id === item.songId);

                return (
                  <div key={item.id} className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-[#111]">{item.type}</div>
                      <div className="text-xs text-[#6b6b65]">{item.songId === "vault" ? "The Vault" : song?.title ?? "Inbox"}</div>
                    </div>
                    <p className="mt-2 leading-6 text-[#514d47]">{item.body}</p>
                    {song ? (
                      <Link href={`/projects/${song.id}`} className="mt-3 inline-flex rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#111]">
                        Open Room
                      </Link>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border-[0.5px] border-dashed border-black/20 bg-[#f8f6f1] p-4 text-sm text-[#6b6b65]">
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
