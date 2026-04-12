"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

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
    territory: "United States",
    distributor: "DistroKid",
  });

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
              placeholder="Late Nights"
              className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-[#514d47]">
              <span className="mb-2 block">ISRC code</span>
              <input
                value={form.isrc}
                onChange={(event) => setForm((current) => ({ ...current, isrc: event.target.value }))}
                placeholder="US-ABC-24-00001"
                className="w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-[#111] outline-none transition focus:border-black/35"
              />
            </label>

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
              ["Genre", "genre", "R&B"],
              ["Mood", "mood", "Late night"],
              ["BPM", "bpm", "92"],
              ["Key", "musicalKey", "A minor"],
              ["Language", "language", "English"],
              ["Territory", "territory", "United States"],
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
              {["DistroKid", "TuneCore", "CD Baby", "Not sure yet"].map((item) => (
                <option key={item}>{item}</option>
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
