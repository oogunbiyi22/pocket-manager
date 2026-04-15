"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useRef } from "react";
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

const FORMAT_META = {
  "Reels 9:16": { label: "Reels 9:16", dims: "1080 × 1920", platforms: ["Instagram", "TikTok"] },
  "Feed 1:1":   { label: "Feed 1:1",   dims: "1080 × 1080", platforms: ["Instagram", "Twitter/X"] },
  "Story 9:16": { label: "Story 9:16", dims: "1080 × 1920", platforms: ["Instagram", "Snapchat"] },
  "YouTube 16:9": { label: "YouTube 16:9", dims: "1920 × 1080", platforms: ["YouTube", "Twitter/X"] },
} as const;

type FormatKey = keyof typeof FORMAT_META;

const contentTypes = ["Release Announcement", "Lyric Card", "Milestone", "Behind the Scenes", "EP Trailer", "Custom"] as const;
const formats = Object.keys(FORMAT_META) as FormatKey[];
const variants = ["Minimal", "Bold", "Cinematic"] as const;

// ── Platform share helpers ───────────────────────────────────────────────────
function getShareUrl(platform: string, text: string): string {
  const encoded = encodeURIComponent(text);
  switch (platform) {
    case "Twitter/X":
      return `https://twitter.com/intent/tweet?text=${encoded}`;
    case "Instagram":
      // Mobile: try deep link; web: open instagram.com (no direct compose API)
      if (typeof window !== "undefined" && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
        return "instagram://camera";
      }
      return "https://www.instagram.com";
    case "TikTok":
      return "https://www.tiktok.com/upload";
    case "YouTube":
      return "https://studio.youtube.com";
    case "Snapchat":
      return "https://www.snapchat.com";
    default:
      return `https://twitter.com/intent/tweet?text=${encoded}`;
  }
}

export default function StudioPage() {
  const { songs } = usePocket();
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [contentType, setContentType] = useState<(typeof contentTypes)[number]>("Release Announcement");
  const [format, setFormat] = useState<FormatKey>("Reels 9:16");
  const [variantIndex, setVariantIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleCopied, setScheduleCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const activeSong = songs.find((song) => song.id === songId) ?? songs[0];
  const variant = variants[variantIndex];
  const hashtags = useMemo(() => generateHashtags(activeSong), [activeSong]);
  const rollout = useMemo(() => generateRollout(activeSong?.releaseDate ?? ""), [activeSong]);
  const formatMeta = FORMAT_META[format];

  const activeCaption = caption || "";
  const fullText = activeCaption
    ? `${activeCaption}\n\n${hashtags.join(" ")}`
    : hashtags.join(" ");

  const captionDrafts = useMemo(() => {
    const title = activeSong?.title ?? "the new record";
    const mood = activeSong?.mood ?? "late-night";
    return [
      `${title} is moving. If this one hits you, run it back and send it to somebody who gets the ${mood} lane.`,
      `New energy from ${title}. Save it, share it, and keep an ear on what comes next.`,
      `${title} is built for the people who stay with the record after midnight. Streaming everywhere.`,
    ];
  }, [activeSong]);

  const handleScheduleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(fullText);
    setScheduleCopied(true);
    setTimeout(() => setScheduleCopied(false), 2000);
  }, [fullText]);

  // ── Web Share API (Level 1) ──────────────────────────────────────────────
  async function handleNativeShare() {
    if (!navigator.share) {
      setShareOpen(true);
      return;
    }
    try {
      await navigator.share({
        title: activeSong?.title ?? "New Music",
        text: fullText,
        url: typeof window !== "undefined" ? window.location.href : "",
      });
      setShareStatus("shared");
      setTimeout(() => setShareStatus(null), 2000);
    } catch {
      // User cancelled or share failed — fall through to manual links
      setShareOpen(true);
    }
  }

  // ── Platform deep link (Level 2) ────────────────────────────────────────
  async function handlePlatformShare(platform: string) {
    // Copy caption first so it's ready to paste
    await navigator.clipboard.writeText(fullText);
    const url = getShareUrl(platform, fullText);
    window.open(url, "_blank", "noopener,noreferrer");
    setShareOpen(false);
    setShareStatus(`Opened ${platform} — caption copied`);
    setTimeout(() => setShareStatus(null), 3000);
  }

  return (
    <AppShell title="Promo Studio" eyebrow="Signal">
      <main className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f0efe8] text-[#111]">
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Promo Studio</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">
            Create for {activeSong?.title ?? "your catalog"}.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Turn your release details into post-ready content. Copy, share, or open your platform directly.
          </p>
        </section>

        <section className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Song</div>
              {songs.length === 0 ? (
                <p className="mt-3 text-sm text-[#9a9a8a]">
                  <Link href="/projects/new" className="underline">Add a release</Link> to get started.
                </p>
              ) : (
                <select
                  value={songId}
                  onChange={(event) => setSongId(event.target.value)}
                  className="mt-3 h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-3 text-sm text-[#111] outline-none"
                >
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>{song.title}</option>
                  ))}
                </select>
              )}
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
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormat(item)}
                    className={`rounded-lg border-[0.5px] px-3 py-3 text-left transition ${
                      format === item ? "border-black/25 bg-[#0a0a0a] text-white" : "border-black/15 bg-[#f8f6f1] text-[#514d47]"
                    }`}
                  >
                    <div className="text-sm">{FORMAT_META[item].label}</div>
                    <div className={`mt-0.5 text-[10px] ${format === item ? "text-white/45" : "text-[#9a9a8a]"}`}>
                      {FORMAT_META[item].dims}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {formatMeta.platforms.map((p) => (
                  <span key={p} className="rounded-full bg-[#f5f4f0] px-2.5 py-0.5 text-[10px] text-[#5d5a54]">{p}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
            <div className="bg-[#111110] p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">Preview</div>
                  <div className="mt-2 text-sm text-white/55">{contentType} · {format} · {formatMeta.dims}</div>
                </div>
                <span className="rounded-full border-[0.5px] border-white/15 px-3 py-1 text-[11px] text-white/55">{variant}</span>
              </div>

              <div ref={previewRef} className={`mt-5 grid min-h-[420px] place-items-center overflow-hidden rounded-xl border-[0.5px] border-white/10 ${previewAspectClass(format)}`}>
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
                    onClick={() => setCaption(caption === item ? "" : item)}
                    className={`w-full rounded-xl border-[0.5px] px-4 py-3 text-left text-sm leading-6 transition ${
                      caption === item ? "border-black/30 bg-[#0a0a0a] text-white" : "border-black/15 bg-[#f8f6f1] text-[#514d47]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Hashtags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#f5f4f0] px-3 py-1 text-[11px] text-[#514d47]">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Share status toast */}
              {shareStatus && (
                <div className="mt-4 rounded-xl bg-[#eaf3de] px-4 py-2.5 text-[12px] text-[#3b6d11]">
                  {shareStatus}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {/* Level 1: Native Share */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a1a1a] active:scale-95"
                >
                  {shareStatus === "shared" ? "Shared ✓" : "Share →"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const text = fullText || (captionDrafts[0] ?? "") + "\n\n" + hashtags.join(" ");
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111] transition hover:bg-[#f5f4f0] active:scale-95"
                >
                  {copied ? "Copied ✓" : "Copy caption"}
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm font-medium text-[#111] transition hover:bg-[#f5f4f0] active:scale-95"
                >
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

      {/* Platform share modal (Level 2 — deep links) */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-t-[24px] bg-white p-6 shadow-2xl sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Share to</div>
                <div className="mt-1 text-lg font-normal text-[#111]">Caption copied on click</div>
              </div>
              <button type="button" onClick={() => setShareOpen(false)} className="text-xl text-[#9a9a8a]">×</button>
            </div>
            <p className="mb-4 text-xs text-[#9a9a8a]">Opens platform in new tab. Caption + hashtags go to clipboard.</p>
            <div className="space-y-2">
              {[
                { name: "Twitter/X", icon: "𝕏", desc: "Pre-filled tweet with caption" },
                { name: "Instagram", icon: "📸", desc: "Opens Instagram — paste caption" },
                { name: "TikTok", icon: "🎵", desc: "Opens TikTok upload page" },
              ].map(({ name, icon, desc }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handlePlatformShare(name)}
                  className="flex w-full items-center gap-3 rounded-xl border-[0.5px] border-black/15 px-4 py-3 text-left transition hover:bg-[#f5f4f0] active:scale-[0.98]"
                >
                  <span className="text-2xl leading-none">{icon}</span>
                  <div>
                    <div className="text-sm font-medium text-[#111]">{name}</div>
                    <div className="text-xs text-[#9a9a8a]">{desc}</div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={handleScheduleCopy}
                className="flex w-full items-center gap-3 rounded-xl border-[0.5px] border-black/15 px-4 py-3 text-left transition hover:bg-[#f5f4f0] active:scale-[0.98]"
              >
                <span className="text-2xl leading-none">📋</span>
                <div>
                  <div className="text-sm font-medium text-[#111]">{scheduleCopied ? "Copied ✓" : "Copy caption + tags"}</div>
                  <div className="text-xs text-[#9a9a8a]">Paste into any app</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {scheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setScheduleOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-t-[24px] bg-white p-6 shadow-2xl sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9a9a8a]">Schedule post</div>
                <div className="mt-1 text-lg font-normal text-[#111]">Pick your platform</div>
              </div>
              <button type="button" onClick={() => setScheduleOpen(false)} className="text-xl text-[#9a9a8a]">×</button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleScheduleCopy}
                className="flex w-full items-center gap-3 rounded-xl border-[0.5px] border-black/15 px-4 py-3 text-left transition hover:bg-[#f5f4f0] active:scale-[0.98]"
              >
                <span className="text-lg">📋</span>
                <div>
                  <div className="text-sm font-medium text-[#111]">{scheduleCopied ? "Copied ✓" : "Copy caption + tags"}</div>
                  <div className="text-xs text-[#9a9a8a]">Paste into any scheduler</div>
                </div>
              </button>
              <a
                href="https://buffer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-xl border-[0.5px] border-black/15 px-4 py-3 text-left transition hover:bg-[#f5f4f0] active:scale-[0.98]"
              >
                <span className="text-lg">🔵</span>
                <div>
                  <div className="text-sm font-medium text-[#111]">Buffer</div>
                  <div className="text-xs text-[#9a9a8a]">Schedule across all platforms</div>
                </div>
              </a>
              <a
                href="https://later.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-xl border-[0.5px] border-black/15 px-4 py-3 text-left transition hover:bg-[#f5f4f0] active:scale-[0.98]"
              >
                <span className="text-lg">🟣</span>
                <div>
                  <div className="text-sm font-medium text-[#111]">Later</div>
                  <div className="text-xs text-[#9a9a8a]">Visual calendar for Instagram &amp; TikTok</div>
                </div>
              </a>
              <a
                href="https://www.hootsuite.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-3 rounded-xl border-[0.5px] border-black/15 px-4 py-3 text-left transition hover:bg-[#f5f4f0] active:scale-[0.98]"
              >
                <span className="text-lg">🦉</span>
                <div>
                  <div className="text-sm font-medium text-[#111]">Hootsuite</div>
                  <div className="text-xs text-[#9a9a8a]">Multi-account management</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
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
