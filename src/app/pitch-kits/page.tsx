"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { formatGapEstimate, getSongEstimatedGap, getSongReadinessScore } from "@/lib/backstage-data";

type Recipient = "Playlist curator" | "Music blog" | "Sync supervisor" | "Label A&R" | "Booking agent" | "Radio programmer";

const PLAYLIST_DATABASE = [
  { name: "Late Night R&B",        genre: "R&B",          mood: "Late night, sensual",     followers: "284K", platform: "Spotify",      fitGenres: ["r&b", "soul", "trap soul"] },
  { name: "Bedroom Soul",           genre: "R&B/Soul",     mood: "Intimate, lo-fi",         followers: "118K", platform: "Spotify",      fitGenres: ["r&b", "soul", "lo-fi", "neo soul"] },
  { name: "Neo Soul Essentials",    genre: "Neo Soul",     mood: "Soulful, warm",           followers: "203K", platform: "Spotify",      fitGenres: ["neo soul", "soul", "r&b"] },
  { name: "After Hours Vibes",      genre: "R&B",          mood: "Smooth, late night",      followers: "91K",  platform: "Apple Music",  fitGenres: ["r&b", "trap soul", "chill"] },
  { name: "Chill Trap & R&B",       genre: "Hip-Hop/R&B",  mood: "Chill, trap influenced",  followers: "455K", platform: "Spotify",      fitGenres: ["hip-hop", "r&b", "trap"] },
  { name: "Afrobeats & Feelings",   genre: "Afrobeats",    mood: "Energetic, romantic",     followers: "89K",  platform: "Tidal",        fitGenres: ["afrobeats", "afropop", "afro"] },
  { name: "Trap Soul 2025",         genre: "Trap Soul",    mood: "Dark, emotional",         followers: "312K", platform: "Spotify",      fitGenres: ["trap soul", "trap", "r&b"] },
  { name: "Gospel & Contemporary",  genre: "Gospel",       mood: "Spiritual, uplifting",    followers: "54K",  platform: "Apple Music",  fitGenres: ["gospel", "ccm", "christian"] },
  { name: "Emotional Hip-Hop",      genre: "Hip-Hop",      mood: "Introspective, raw",      followers: "229K", platform: "Spotify",      fitGenres: ["hip-hop", "rap", "conscious"] },
  { name: "Lo-Fi R&B Vault",        genre: "Lo-fi R&B",    mood: "Mellow, introspective",   followers: "96K",  platform: "Spotify",      fitGenres: ["lo-fi", "r&b", "chill"] },
  { name: "Summer Afro Hits",       genre: "Afrobeats",    mood: "Upbeat, celebratory",     followers: "140K", platform: "Apple Music",  fitGenres: ["afrobeats", "afropop", "dancehall"] },
  { name: "Indie R&B Discovery",    genre: "Indie R&B",    mood: "Alternative, moody",      followers: "43K",  platform: "Spotify",      fitGenres: ["indie r&b", "indie", "r&b", "alternative"] },
  { name: "New Generation R&B",     genre: "Contemporary R&B", mood: "Fresh, emotional",   followers: "155K", platform: "YouTube Music",fitGenres: ["r&b", "contemporary", "pop r&b"] },
  { name: "Hip-Hop Heads Daily",    genre: "Hip-Hop",      mood: "Lyrical, boom bap",       followers: "580K", platform: "Spotify",      fitGenres: ["hip-hop", "rap", "boom bap"] },
  { name: "Drill & R&B Crossover",  genre: "Drill",        mood: "Hard, emotional",         followers: "178K", platform: "Spotify",      fitGenres: ["drill", "hip-hop", "r&b", "uk drill"] },
  { name: "Soulful Mornings",       genre: "Soul",         mood: "Uplifting, morning",      followers: "77K",  platform: "Apple Music",  fitGenres: ["soul", "r&b", "gospel"] },
  { name: "UK R&B Radar",           genre: "UK R&B",       mood: "Urban, smooth",           followers: "62K",  platform: "Spotify",      fitGenres: ["uk r&b", "r&b", "grime adjacent"] },
  { name: "Piano R&B",              genre: "R&B",          mood: "Acoustic, intimate",      followers: "67K",  platform: "Tidal",        fitGenres: ["r&b", "soul", "piano", "acoustic"] },
  { name: "Sunday Morning Gospel",  genre: "Gospel/CCM",   mood: "Peaceful, worshipful",    followers: "38K",  platform: "Apple Music",  fitGenres: ["gospel", "worship", "christian", "ccm"] },
  { name: "Smooth Jazz & Soul",     genre: "Jazz/Soul",    mood: "Relaxed, sophisticated",  followers: "81K",  platform: "Spotify",      fitGenres: ["jazz", "soul", "neo soul"] },
];

function computeFit(songGenre: string, songMood: string, pl: typeof PLAYLIST_DATABASE[0]): number {
  const sg = songGenre.toLowerCase();
  const sm = songMood.toLowerCase();
  let score = 40;
  if (pl.fitGenres.some((g) => sg.includes(g) || g.includes(sg))) score += 35;
  else if (pl.fitGenres.some((g) => sg.split(/[/,\s&]+/).some((part) => part.trim() && g.includes(part.trim())))) score += 18;
  const moodTerms = pl.mood.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const moodMatches = moodTerms.filter((t) => sm.includes(t)).length;
  score += Math.min(moodMatches * 8, 25);
  return Math.min(99, score);
}

function generateEmail(
  recipientType: Recipient,
  artistName: string,
  song: ReturnType<typeof useMemo> extends never ? never : { title: string; genre?: string; mood?: string; bpm?: number; musicalKey?: string; releaseDate: string; isrc?: string; territory: string },
  contact: string,
  targetName?: string,
): string {
  const g = song.genre ?? "genre-pending";
  const m = song.mood ?? "mood-pending";

  if (recipientType === "Playlist curator") {
    return [
      `Subject: ${artistName} — "${song.title}" for ${targetName ?? "your playlist"}`,
      "",
      `Hi ${targetName ? `@${targetName.replace(/^@/, "")}` : "Curator"},`,
      "",
      `I'm reaching out about "${song.title}" — a ${g} record with a ${m} feel that I think would be a natural fit for ${targetName ?? "your playlist"}.`,
      "",
      `The track runs${song.bpm ? ` at ${song.bpm} BPM` : ""}, key of ${song.musicalKey ?? "undisclosed"}, out since ${song.releaseDate}. Available on all major platforms.`,
      `ISRC: ${song.isrc ?? "on request"}`,
      "",
      `Happy to send the cover art, one-sheet, or any additional assets if useful.`,
      "",
      `Thanks for listening,`,
      `${artistName}`,
      contact ? `${contact}` : "",
    ].filter((l) => l !== "").join("\n");
  }

  if (recipientType === "Sync supervisor") {
    return [
      `Subject: Sync submission — ${artistName}, "${song.title}"`,
      "",
      `Hi,`,
      "",
      `I'm submitting "${song.title}" by ${artistName} for sync consideration.`,
      "",
      `Genre: ${g}`,
      `Mood: ${m}`,
      `BPM: ${song.bpm ?? "on request"}`,
      `Key: ${song.musicalKey ?? "on request"}`,
      `Territory: ${song.territory}`,
      `ISRC: ${song.isrc ?? "on request"}`,
      `Release date: ${song.releaseDate}`,
      "",
      `Master and sync rights are available. Happy to provide stems, instrumental, and a clean version on request.`,
      "",
      `${artistName}`,
      contact ? `${contact}` : "",
    ].filter((l) => l !== "").join("\n");
  }

  if (recipientType === "Label A&R") {
    return [
      `Subject: ${artistName} — new ${g} release, "${song.title}"`,
      "",
      `Hi,`,
      "",
      `I'm reaching out to share "${song.title}", a ${g} record from ${artistName}. Released ${song.releaseDate}.`,
      "",
      `Mood: ${m}. Metadata, splits, and master recordings are all clean and registered.`,
      "",
      `I'm looking for a conversation about next steps — whether that's licensing, distribution, or a broader partnership.`,
      "",
      `${artistName}`,
      contact ? `${contact}` : "",
    ].filter((l) => l !== "").join("\n");
  }

  if (recipientType === "Booking agent") {
    return [
      `Subject: ${artistName} — booking inquiry`,
      "",
      `Hi,`,
      "",
      `I'm ${artistName}, an independent ${g} artist. My latest release "${song.title}" dropped ${song.releaseDate} and I'm looking to book live dates around the release cycle.`,
      "",
      `Mood and energy: ${m}. Available for showcases, headline sets, and support slots.`,
      "",
      `${artistName}`,
      contact ? `${contact}` : "",
    ].filter((l) => l !== "").join("\n");
  }

  if (recipientType === "Radio programmer") {
    return [
      `Subject: Add to rotation — ${artistName}, "${song.title}"`,
      "",
      `Hi,`,
      "",
      `I'm submitting "${song.title}" by ${artistName} for radio consideration.`,
      "",
      `Genre: ${g} · Mood: ${m} · BPM: ${song.bpm ?? "on request"}`,
      `Released: ${song.releaseDate} · ISRC: ${song.isrc ?? "on request"}`,
      "",
      `The track is clean, properly licensed, and available for airplay immediately.`,
      "",
      `${artistName}`,
      contact ? `${contact}` : "",
    ].filter((l) => l !== "").join("\n");
  }

  // Music blog default
  return [
    `Subject: Feature opportunity — ${artistName}, "${song.title}"`,
    "",
    `Hi,`,
    "",
    `I'm reaching out about a feature opportunity for "${song.title}" — a ${g} release from ${artistName} out since ${song.releaseDate}.`,
    "",
    `Mood: ${m}. The release has full metadata, press assets, and a one-sheet ready to go.`,
    "",
    `Happy to offer an exclusive stream, interview, or premiere if the timing works.`,
    "",
    `${artistName}`,
    contact ? `${contact}` : "",
  ].filter((l) => l !== "").join("\n");
}

export default function PitchKitsPage() {
  const { profile, songs } = usePocket();
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [recipient, setRecipient] = useState<Recipient>("Playlist curator");
  const [contact, setContact] = useState(profile.email ?? "");
  const [copied, setCopied] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [tab, setTab] = useState<"pitch" | "playlists">("pitch");

  const song = songs.find((item) => item.id === songId) ?? songs[0];

  // Matched playlists for this song
  const matchedPlaylists = useMemo(() => {
    if (!song) return [];
    return PLAYLIST_DATABASE
      .map((pl) => ({ ...pl, fit: computeFit(song.genre ?? "", song.mood ?? "", pl) }))
      .sort((a, b) => b.fit - a.fit);
  }, [song]);

  const targetPlaylist = matchedPlaylists.find((p) => p.name === selectedPlaylist);

  const pitchText = useMemo(() => {
    if (!song) return "Add a song before creating a pitch kit.";
    return generateEmail(recipient, profile.artistName ?? "Artist", song as Parameters<typeof generateEmail>[2], contact, selectedPlaylist ?? undefined);
  }, [contact, profile.artistName, recipient, song, selectedPlaylist]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pitchText]);

  return (
    <AppShell title="Pitch Kit" eyebrow="Signal">
      <main className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border-[0.5px] border-white/10 bg-white/5 text-white/90">
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Outreach package</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">Turn catalog data into a focused pitch.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Pick a song and a target. We match the genre, mood, and BPM to the right contacts and generate the pitch email automatically.
          </p>
        </section>

        {/* Tabs */}
        <div className="flex border-b-[0.5px] border-white/8 bg-[#0d0d0b]">
          {(["pitch", "playlists"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-[12px] font-medium capitalize transition ${tab === t ? "border-b-2 border-[#0a0a0a] text-white/90" : "text-white/50"}`}
            >
              {t === "playlists" ? `Playlist matches${song ? ` (${matchedPlaylists.length})` : ""}` : "Pitch builder"}
            </button>
          ))}
        </div>

        {tab === "pitch" ? (
          <section className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-xl border-[0.5px] border-white/10 glass p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Pitch inputs</div>
                <label className="mt-4 block text-sm text-white/60">
                  <span className="mb-2 block">Song</span>
                  <select
                    value={songId}
                    onChange={(event) => { setSongId(event.target.value); setSelectedPlaylist(null); }}
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                  >
                    {songs.map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 block text-sm text-white/60">
                  <span className="mb-2 block">Target</span>
                  <select
                    value={recipient}
                    onChange={(event) => { setRecipient(event.target.value as Recipient); setSelectedPlaylist(null); }}
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                  >
                    {(["Playlist curator", "Music blog", "Sync supervisor", "Label A&R", "Booking agent", "Radio programmer"] as Recipient[]).map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                {recipient === "Playlist curator" && (
                  <label className="mt-3 block text-sm text-white/60">
                    <span className="mb-2 block">
                      Playlist{" "}
                      <button type="button" onClick={() => setTab("playlists")} className="text-[#f0a832] underline-offset-2 hover:underline">
                        (browse matches →)
                      </button>
                    </span>
                    <input
                      value={selectedPlaylist ?? ""}
                      onChange={(e) => setSelectedPlaylist(e.target.value || null)}
                      placeholder="Playlist name or paste from matches tab"
                      className="h-10 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                    />
                    {targetPlaylist && (
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#5fcf7e]">
                        <span>{targetPlaylist.fit}% fit</span>
                        <span>·</span>
                        <span>{targetPlaylist.followers} followers</span>
                        <span>·</span>
                        <span>{targetPlaylist.platform}</span>
                      </div>
                    )}
                  </label>
                )}
                <label className="mt-3 block text-sm text-white/60">
                  <span className="mb-2 block">Your contact</span>
                  <input
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    className="h-12 w-full rounded-lg border-[0.5px] border-white/10 bg-white/8 px-3 text-sm text-white/90 outline-none"
                  />
                </label>
              </div>

              {song ? (
                <div className="rounded-xl border-[0.5px] border-white/10 glass p-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Song facts used in pitch</div>
                  <div className="mt-3 grid gap-2 text-sm">
                    <Fact label="Genre" value={song.genre ?? "—"} flag={!song.genre} />
                    <Fact label="Mood" value={song.mood ?? "—"} flag={!song.mood} />
                    <Fact label="BPM" value={song.bpm ? String(song.bpm) : "—"} flag={!song.bpm} />
                    <Fact label="Key" value={song.musicalKey ?? "—"} flag={!song.musicalKey} />
                    <Fact label="ISRC" value={song.isrc ?? "—"} flag={!song.isrc} />
                    <Fact label="Readiness" value={`${getSongReadinessScore(song)}/100`} />
                    <Fact label="Est. gap" value={formatGapEstimate(getSongEstimatedGap(song))} />
                  </div>
                  {(!song.genre || !song.mood) && (
                    <p className="mt-3 text-[11px] text-[#f0a832]">
                      Add genre and mood to this song for a stronger pitch →{" "}
                      <Link href={`/projects/${song.id}`} className="underline">Edit song</Link>
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border-[0.5px] border-white/10 glass p-5">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
                Generated pitch
                {recipient === "Playlist curator" && selectedPlaylist
                  ? ` — ${selectedPlaylist}`
                  : ` — ${recipient}`}
              </div>
              <pre className="mt-4 min-h-80 whitespace-pre-wrap rounded-xl border-[0.5px] border-white/8 glass p-4 text-sm leading-6 text-white/60">
                {pitchText}
              </pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm text-white"
                >
                  {copied ? "Copied ✓" : "Copy pitch"}
                </button>
                <a
                  href={`mailto:${contact}?subject=${encodeURIComponent(`${profile.artistName ?? "Artist"} — "${song?.title ?? "New release"}"`)}& body=${encodeURIComponent(pitchText)}`}
                  className="rounded-lg border-[0.5px] border-white/10 px-4 py-2 text-sm text-white/90"
                >
                  Open in Mail →
                </a>
                <Link href="/epk" className="rounded-lg border-[0.5px] border-white/10 px-4 py-2 text-sm text-white/60">
                  Share EPK
                </Link>
              </div>
            </div>
          </section>
        ) : (
          /* Playlist matches tab */
          <section className="p-5">
            {!song ? (
              <div className="rounded-xl border-[0.5px] border-dashed border-white/10 p-8 text-center text-sm text-white/50">
                Add a song to see matching playlists.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white/90">Matching playlists for &ldquo;{song.title}&rdquo;</div>
                    <div className="mt-0.5 text-[12px] text-white/50">
                      Sorted by genre/mood fit · {song.genre ?? "no genre set"} · {song.mood ?? "no mood set"}
                    </div>
                  </div>
                  <select
                    value={songId}
                    onChange={(e) => setSongId(e.target.value)}
                    className="h-9 rounded-lg border-[0.5px] border-white/10 bg-white/8 px-2 text-sm text-white/90 outline-none"
                  >
                    {songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  {matchedPlaylists.map((pl) => (
                    <div key={pl.name} className="flex items-center gap-3 rounded-xl border-[0.5px] border-white/8 bg-white/[0.06] px-4 py-3">
                      {/* Fit bar */}
                      <div className="flex w-10 flex-col items-center">
                        <div className="text-[14px] font-medium text-white/90">{pl.fit}</div>
                        <div className="text-[9px] text-white/50">fit</div>
                      </div>
                      <div className="h-8 w-px bg-black/[0.06]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-medium text-white/90">{pl.name}</span>
                          <span className="rounded-full border-[0.5px] border-white/8 px-2 py-0.5 text-[10px] text-white/50">{pl.platform}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/50">
                          {pl.followers} followers · {pl.genre} · {pl.mood}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedPlaylist(pl.name); setTab("pitch"); setRecipient("Playlist curator"); }}
                        className="shrink-0 rounded-lg border-[0.5px] border-white/10 px-3 py-1.5 text-[12px] text-white/90 transition hover:bg-white/5"
                      >
                        Pitch this →
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}

function Fact({ label, value, flag }: { label: string; value: string; flag?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border-[0.5px] border-white/8 bg-white/[0.06] px-3 py-2">
      <span className="text-white/50">{label}</span>
      <span className={flag ? "text-[#f0a832]" : "text-white/90"}>{value}</span>
    </div>
  );
}
