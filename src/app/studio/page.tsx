"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import type { SongCatalogItem } from "@/lib/backstage-data";

function generateHashtags(song: SongCatalogItem | undefined): string[] {
  const tags: string[] = [];
  if (song?.genre) tags.push(`#${song.genre.replace(/\s+/g, "")}`);
  if (song?.mood) tags.push(`#${song.mood.replace(/\s+/g, "")}`);
  if (song?.title) tags.push(`#${song.title.replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "")}`);
  tags.push("#NewMusic", "#IndependentArtist", "#StreamingNow");
  if (song?.genre?.toLowerCase().includes("r&b")) tags.push("#RnB", "#SoulMusic");
  if (song?.mood?.toLowerCase().includes("night")) tags.push("#LateNight", "#NightVibes");
  return [...new Set(tags)].slice(0, 8);
}

function generateRollout(releaseDate: string): { week: string; content: string; status: "Done" | "Due" | "Upcoming" }[] {
  const today = new Date();
  const release = new Date(`${releaseDate}T12:00:00`);
  const daysUntil = Math.ceil((release.getTime() - today.getTime()) / 86400000);
  return [
    { week: "Week −2", content: "Teaser clip + pre-save link goes live", status: daysUntil > 14 ? "Upcoming" : daysUntil > 7 ? "Due" : "Done" },
    { week: "Week −1", content: "Behind-the-scenes story + caption set", status: daysUntil > 7 ? "Upcoming" : daysUntil > 0 ? "Due" : "Done" },
    { week: "Release", content: "Announcement post + playlist pitches", status: daysUntil > 0 ? "Upcoming" : daysUntil >= -3 ? "Due" : "Done" },
    { week: "Week +1", content: "Fan reaction prompt + lyric card", status: daysUntil >= -7 ? "Upcoming" : "Done" },
  ];
}

const contentTypes = ["Release Announcement", "Lyric Card", "Milestone", "Behind the Scenes", "EP Trailer", "Custom"] as const;
const formats = ["Reels 9:16", "Feed 1:1", "Story 9:16", "YouTube 16:9"] as const;
const variants = ["Minimal", "Bold", "Cinematic"] as const;

export default function StudioPage() {
  const { songs } = usePocket();
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [contentType, setContentType] = useState<(typeof contentTypes)[number]>("Release Announcement");
  const [format, setFormat] = useState<(typeof formats)[number]>("Reels 9:16");
  const [variantIndex, setVariantIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const activeSong = songs.find((song) => song.id === songId) ?? songs[0];
  const variant = variants[variantIndex];
  const hashtags = useMemo(() => generateHashtags(activeSong), [activeSong]);
  const rollout = useMemo(() => generateRollout(activeSong?.releaseDate ?? ""), [activeSong]);

  const captionDrafts = useMemo(() => {
    const title = activeSong?.title ?? "the new record";
    const mood = activeSong?.mood ?? "late-night";

    return [
      `${title} is moving. If this one hits you, run it back and send it to somebody who gets the ${mood} lane.`,
      `New energy from ${title}. Save it, share it, and keep an ear on what comes next.`,
      `${title} is built for the people who stay with the record after midnight. Streaming everywhere.`,
    ];
  }, [activeSong]);

  return (
    <AppShell title="Promo Studio" eyebrow="Signal">
      <main className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f0efe8] text-[#111]">
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Promo Studio</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">
            Create for {activeSong?.title ?? "your catalog"}.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Turn the song, cover direction, and release details into post-ready assets. This screen is the clickable flow before the render backend is wired.
          </p>
        </section>

        <section className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Song</div>
              <select
                value={songId}
                onChange={(event) => setSongId(event.target.value)}
                className="mt-3 h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-3 text-sm text-[#111] outline-none"
              >
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>{song.title}</option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Content type</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {contentTypes.map((item) => (
                  <ChoiceButton key={item} active={contentType === item} onClick={() => setContentType(item)}>
                    {item}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Format</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {formats.map((item) => (
                  <ChoiceButton key={item} active={format === item} onClick={() => setFormat(item)}>
                    {item}
                  </ChoiceButton>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
            <div className="bg-[#111110] p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Generated preview</div>
                  <div className="mt-2 text-sm text-white/55">{contentType} · {format}</div>
                </div>
                <span className="rounded-full border-[0.5px] border-white/15 px-3 py-1 text-[11px] text-white/55">{variant}</span>
              </div>

              <div className={`mt-5 grid min-h-[420px] place-items-center overflow-hidden rounded-xl border-[0.5px] border-white/10 ${previewAspectClass(format)}`}>
                <div className="w-full px-6 text-center">
                  <div className="mx-auto grid size-28 place-items-center rounded-2xl border-[0.5px] border-white/15 bg-white/10 text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Art
                  </div>
                  <div className="mt-8 text-[34px] font-light leading-none tracking-[-0.03em] text-white">
                    {activeSong?.title ?? "Untitled"}
                  </div>
                  <div className="mt-4 text-sm text-white/45">
                    {activeSong?.releaseDate ?? "Release date"} · {activeSong?.mood ?? "Mood"}
                  </div>
                  <div className="mt-8 inline-flex rounded-full bg-white px-4 py-2 text-xs font-medium text-[#111110]">
                    Streaming everywhere
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                {variants.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setVariantIndex(index)}
                    className={`h-2 rounded-full transition ${variantIndex === index ? "w-8 bg-white" : "w-2 bg-white/25"}`}
                    aria-label={`Select ${item} variant`}
                  />
                ))}
              </div>
            </div>

            <div className="p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Captions</div>
              <div className="mt-3 space-y-2">
                {captionDrafts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCaption(item)}
                    className={`w-full rounded-xl border-[0.5px] px-4 py-3 text-left text-sm leading-6 transition ${
                      caption === item ? "border-black/30 bg-[#0a0a0a] text-white" : "border-black/15 bg-[#f8f6f1] text-[#514d47]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Hashtags */}
              <div className="mt-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Hashtags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#f5f4f0] px-3 py-1 text-[11px] text-[#514d47]">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const text = caption
                      ? `${caption}\n\n${hashtags.join(" ")}`
                      : captionDrafts[0] + "\n\n" + hashtags.join(" ");
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white"
                >
                  {copied ? "Copied ✓" : "Copy caption + tags"}
                </button>
                <button type="button" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111]">
                  Schedule
                </button>
                <Link href="/signal" className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111]">
                  Signal →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4-week rollout schedule */}
        {activeSong && (
          <section className="border-t border-black/10 px-5 py-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">
              Release rollout · {activeSong.title}
            </div>
            <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
              {rollout.map((row, i) => (
                <div
                  key={row.week}
                  className={`flex items-center gap-4 px-4 py-3 text-sm ${i < rollout.length - 1 ? "border-b-[0.5px] border-black/10" : ""}`}
                >
                  <span className="w-20 shrink-0 text-[11px] font-medium text-[#9a9a8a]">{row.week}</span>
                  <span className="flex-1 text-[#111]">{row.content}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    row.status === "Done" ? "bg-[#eaf3de] text-[#3b6d11]" :
                    row.status === "Due" ? "bg-[#faeeda] text-[#854f0b]" :
                    "bg-white text-[#9a9a8a] border border-black/10"
                  }`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function ChoiceButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-[0.5px] px-3 py-3 text-left text-sm transition ${
        active ? "border-black/25 bg-[#0a0a0a] text-white" : "border-black/15 bg-[#f8f6f1] text-[#514d47]"
      }`}
    >
      {children}
    </button>
  );
}

function previewAspectClass(format: string) {
  if (format.includes("1:1")) return "aspect-square";
  if (format.includes("16:9")) return "aspect-video";
  return "aspect-[9/16]";
}
