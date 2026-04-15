"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

type MBResult = {
  title: string;
  artist?: string;
  releaseDate?: string;
};

function isValidIsrc(raw: string) {
  const stripped = raw.replace(/-/g, "").toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(stripped);
}

export default function NewProjectPage() {
  const router = useRouter();
  const { createSong } = usePocket();
  const [form, setForm] = useState({
    title: "",
    isrc: "",
    upc: "",
    releaseDate: "",
    genre: "",
    mood: "",
    bpm: "",
    musicalKey: "",
    language: "",
    territory: "",
    distributor: "",
  });

  const [mbLookup, setMbLookup] = useState<{ status: "idle" | "loading" | "found" | "not-found"; result?: MBResult }>({ status: "idle" });
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function lookupIsrc(raw: string) {
    const stripped = raw.replace(/-/g, "").toUpperCase();
    if (!isValidIsrc(raw)) {
      setMbLookup({ status: "idle" });
      return;
    }
    setMbLookup({ status: "loading" });
    try {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/isrc/${stripped}?fmt=json&inc=recordings`,
        { headers: { "User-Agent": "PocketManager/0.1 (hello@pocketmanager.app)" } },
      );
      if (!res.ok) throw new Error("not found");
      const data = await res.json() as { recordings?: { title: string; "artist-credit"?: { name: string }[]; "first-release-date"?: string }[] };
      const rec = data.recordings?.[0];
      if (!rec) throw new Error("not found");
      const artist = rec["artist-credit"]?.[0]?.name;
      setMbLookup({
        status: "found",
        result: {
          title: rec.title,
          artist,
          releaseDate: rec["first-release-date"],
        },
      });
    } catch {
      setMbLookup({ status: "not-found" });
    }
  }

  function handleIsrcChange(value: string) {
    setForm((f) => ({ ...f, isrc: value }));
    setMbLookup({ status: "idle" });
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    if (value.trim()) {
      lookupTimeout.current = setTimeout(() => lookupIsrc(value), 600);
    }
  }

  function applyMbResult() {
    if (!mbLookup.result) return;
    setForm((f) => ({
      ...f,
      title: f.title || mbLookup.result!.title,
      releaseDate: f.releaseDate || mbLookup.result!.releaseDate || "",
    }));
    setMbLookup((s) => ({ ...s, status: "idle" }));
  }

  function submitSong() {
    const title = form.title.trim();

    if (!title) {
      return;
    }

    const songId = createSong({
      title,
      isrc: form.isrc,
      upc: form.upc,
      releaseDate: form.releaseDate,
      genre: form.genre,
      mood: form.mood,
      bpm: form.bpm ? Number(form.bpm) : undefined,
      musicalKey: form.musicalKey,
      language: form.language,
      territory: form.territory,
      distributor: form.distributor,
    });

    if (songId) {
      router.push(`/projects/${songId}`);
    }
  }

  return (
    <AppShell title="Add Song" eyebrow="Catalog">
      <main className="mx-auto max-w-3xl rounded-[24px] border-[0.5px] border-black/15 bg-white p-5 text-[#111]">
        <section className="rounded-xl border-[0.5px] border-black/15 bg-[#0a0a0a] p-5 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Add your releases</div>
          <h2 className="mt-3 text-4xl font-normal tracking-[-0.03em]">Start with one song.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Pocket needs the song before it can find missing money. Add the title now, then connect platforms to reveal the first gap.
          </p>
        </section>

        <section className="mt-5 grid gap-4">
          <label className="block text-sm text-[#514d47]">
            <span className="mb-2 block">Song title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Enter song title"
              className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="block text-sm text-[#514d47]">
              <span className="mb-2 block">ISRC code</span>
              <div className="relative">
                <input
                  value={form.isrc}
                  onChange={(e) => handleIsrcChange(e.target.value)}
                  placeholder="US-ABC-24-00001"
                  className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
                />
                {mbLookup.status === "loading" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9a9a8a]">Looking up…</span>
                )}
              </div>
              {mbLookup.status === "found" && mbLookup.result && (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border-[0.5px] border-[#97c459]/50 bg-[#eaf3de] px-3 py-2.5 text-xs">
                  <div>
                    <span className="font-medium text-[#3b6d11]">{mbLookup.result.title}</span>
                    {mbLookup.result.artist && <span className="ml-1 text-[#3b6d11]/70">· {mbLookup.result.artist}</span>}
                    {mbLookup.result.releaseDate && <span className="ml-1 text-[#3b6d11]/50">· {mbLookup.result.releaseDate}</span>}
                  </div>
                  <button type="button" onClick={applyMbResult} className="shrink-0 font-medium text-[#3b6d11]">
                    Use →
                  </button>
                </div>
              )}
              {mbLookup.status === "not-found" && (
                <div className="mt-1.5 text-xs text-[#9a9a8a]">ISRC not found in MusicBrainz — enter details manually.</div>
              )}
            </div>

            <label className="block text-sm text-[#514d47]">
              <span className="mb-2 block">UPC</span>
              <input
                value={form.upc}
                onChange={(event) => setForm((current) => ({ ...current, upc: event.target.value }))}
                placeholder="196871234567"
                className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
              />
            </label>

            <label className="block text-sm text-[#514d47]">
              <span className="mb-2 block">Release date</span>
              <input
                type="date"
                value={form.releaseDate}
                onChange={(event) => setForm((current) => ({ ...current, releaseDate: event.target.value }))}
                className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Genre", "genre", "e.g. R&B"],
              ["Mood", "mood", "e.g. Late night"],
              ["BPM", "bpm", "e.g. 92"],
              ["Key", "musicalKey", "e.g. A minor"],
              ["Language", "language", "e.g. English"],
              ["Territory", "territory", "e.g. United States"],
            ].map(([label, key, placeholder]) => (
              <label key={key} className="block text-sm text-[#514d47]">
                <span className="mb-2 block">{label}</span>
                <input
                  type={key === "bpm" ? "number" : "text"}
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
                />
              </label>
            ))}
          </div>

          <label className="block text-sm text-[#514d47]">
            <span className="mb-2 block">Where is it distributed?</span>
            <select
              value={form.distributor}
              onChange={(event) => setForm((current) => ({ ...current, distributor: event.target.value }))}
              className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
            >
              {["", "DistroKid", "TuneCore", "CD Baby", "ONErpm", "UnitedMasters", "Amuse", "Stem", "Other", "Not sure yet"].map((item) => (
                <option key={item} value={item}>{item || "Select distributor…"}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border-[0.5px] border-[#ef9f27]/50 bg-[#ef9f27]/20 p-4 text-sm leading-6 text-[#854f0b]">
            Next: connect one platform. If Pocket cannot calculate a gap yet, it will show the registration checklist instead of a blank number.
          </div>

          <button type="button" onClick={submitSong} className="rounded-lg bg-[#0a0a0a] px-5 py-3 text-sm font-medium text-white transition hover:bg-black/80">
            Add song
          </button>
        </section>
      </main>
    </AppShell>
  );
}
