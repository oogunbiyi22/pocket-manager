"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

type DropItem = {
  id: string;
  type: "Note" | "Voice memo" | "File" | "Link";
  body: string;
  songId: string;
  createdAt: string;
};

const CAPTURE_STORAGE_KEY = "pocket-manager-captures";

export default function CapturePage() {
  const { songs } = usePocket();
  const [type, setType] = useState<DropItem["type"]>("Note");
  const [songId, setSongId] = useState(songs[0]?.id ?? "inbox");
  const [body, setBody] = useState("");
  const [items, setItems] = useState<DropItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(CAPTURE_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as DropItem[]) : [];
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
    <AppShell title="Drop" eyebrow="Fast capture">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Drop</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Save it before it gets lost.</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Capture notes, voice reminders, links, and file references. Route them to a Room now or leave them in the inbox.
          </p>
        </section>

        <section className="mt-5 grid gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["Note", "Voice memo", "File", "Link"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setType(item)}
                className={`rounded-lg border-[0.5px] px-3 py-3 text-sm ${
                  type === item ? "border-black/25 bg-[#0a0a0a] text-white" : "border-black/15 bg-[#f8f6f1] text-[#111]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <select
            value={songId}
            onChange={(event) => setSongId(event.target.value)}
            className="h-12 rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-3 text-sm outline-none"
          >
            <option value="inbox">Inbox, route later</option>
            {songs.map((song) => (
              <option key={song.id} value={song.id}>
                {song.title}
              </option>
            ))}
          </select>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={type === "Link" ? "Paste link or reference" : type === "File" ? "Describe the file you need to attach" : "Write the thought fast"}
            className="min-h-40 rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm leading-6 outline-none"
          />

          <button type="button" onClick={saveCapture} className="h-[52px] rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white">
            Save Drop
          </button>
        </section>

        <section className="mt-6">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Inbox</div>
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => {
                const song = songs.find((candidate) => candidate.id === item.songId);

                return (
                  <div key={item.id} className="rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-[#111]">{item.type}</div>
                      <div className="text-xs text-[#6b6b65]">{song?.title ?? "Inbox"}</div>
                    </div>
                    <p className="mt-2 leading-6 text-[#514d47]">{item.body}</p>
                    {song ? (
                      <Link href={`/projects/${song.id}`} className="mt-3 inline-flex rounded-lg border-[0.5px] border-black/15 px-3 py-2 text-xs text-[#111]">
                        Open song
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
