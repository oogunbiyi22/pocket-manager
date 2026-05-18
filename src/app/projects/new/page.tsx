"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { Search, Music, Check, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  releaseDate: string;
  primaryGenreName: string;
  trackTimeMillis: number;
  country: string;
};

type MBResult = {
  title: string;
  artist?: string;
  releaseDate?: string;
};

function isValidIsrc(raw: string) {
  const stripped = raw.replace(/-/g, "").toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(stripped);
}

function artworkUrl(url: string, size = 300) {
  return url.replace("100x100", `${size}x${size}`);
}

function durationLabel(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Song Search (iTunes) ──────────────────────────────────────────────────────

function SongSearch({ onSelect }: { onSelect: (track: ItunesTrack) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function search(q: string) {
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8&country=us`,
      );
      const data = await res.json() as { results: ItunesTrack[] };
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length >= 2) {
      debounce.current = setTimeout(() => search(value), 350);
    } else {
      setResults([]);
      setOpen(false);
    }
  }

  function pick(track: ItunesTrack) {
    onSelect(track);
    setQuery(`${track.trackName} — ${track.artistName}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search Spotify, Apple Music, iTunes…"
          className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/5 pl-9 pr-10 py-3 text-white/90 text-sm outline-none transition focus:border-[#7c6fef]/50"
        />
        {loading && <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 animate-spin" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1.5 w-full overflow-hidden rounded-xl border-[0.5px] border-white/10 bg-[#14141f] shadow-xl shadow-black/60">
          {results.map(track => (
            <button
              key={track.trackId}
              type="button"
              onClick={() => pick(track)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
            >
              {track.artworkUrl100 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artworkUrl(track.artworkUrl100, 60)}
                  alt=""
                  className="size-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <Music size={16} className="text-white/50" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white/90">{track.trackName}</div>
                <div className="truncate text-xs text-white/50">
                  {track.artistName} · {track.collectionName}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-white/50">{track.primaryGenreName}</div>
                {track.trackTimeMillis && (
                  <div className="text-xs text-[#b8b5ae]">{durationLabel(track.trackTimeMillis)}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();
  const { createSong, profile, songs } = usePocket();
  const atFreeLimit = profile.plan === "free" && songs.length >= 3;
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
  const [selectedArtwork, setSelectedArtwork] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [mbLookup, setMbLookup] = useState<{ status: "idle" | "loading" | "found" | "not-found"; result?: MBResult }>({ status: "idle" });
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleItunesSelect = useCallback((track: ItunesTrack) => {
    setForm(f => ({
      ...f,
      title: track.trackName,
      releaseDate: track.releaseDate ? track.releaseDate.split("T")[0] : f.releaseDate,
      genre: track.primaryGenreName ?? f.genre,
      language: f.language || "English",
      territory: f.territory || "United States",
    }));
    setSelectedArtwork(artworkUrl(track.artworkUrl100, 300));
  }, []);

  async function lookupIsrc(raw: string) {
    const stripped = raw.replace(/-/g, "").toUpperCase();
    if (!isValidIsrc(raw)) { setMbLookup({ status: "idle" }); return; }
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
      setMbLookup({ status: "found", result: { title: rec.title, artist: rec["artist-credit"]?.[0]?.name, releaseDate: rec["first-release-date"] } });
    } catch {
      setMbLookup({ status: "not-found" });
    }
  }

  function handleIsrcChange(value: string) {
    setForm(f => ({ ...f, isrc: value }));
    setMbLookup({ status: "idle" });
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    if (value.trim()) {
      lookupTimeout.current = setTimeout(() => lookupIsrc(value), 600);
    }
  }

  function applyMbResult() {
    if (!mbLookup.result) return;
    setForm(f => ({
      ...f,
      title: f.title || mbLookup.result!.title,
      releaseDate: f.releaseDate || mbLookup.result!.releaseDate || "",
    }));
    setMbLookup(s => ({ ...s, status: "idle" }));
  }

  function submitSong() {
    const title = form.title.trim();
    if (!title) return;
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
    if (songId) router.push(`/projects/${songId}`);
  }

  return (
    <AppShell title="Add Song" eyebrow="Catalog">
      <main className="mx-auto max-w-3xl space-y-4 text-white/90">

        {/* Hero */}
        <section className="overflow-hidden rounded-[24px] bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Add release</div>
          <h2 className="mt-3 text-[32px] font-light leading-tight tracking-[-0.03em]">Start with one song.</h2>
          <p className="mt-2 text-sm leading-6 text-white/40">
            Search and we auto-fill everything. Or just type the title and add details later.
          </p>
        </section>

        <section className="rounded-[24px] border-[0.5px] border-white/10 glass p-5">

          {/* Smart search — always first */}
          <SongSearch onSelect={handleItunesSelect} />

          {/* Artwork + fill confirmation */}
          {selectedArtwork && (
            <div className="mt-3 flex items-center gap-4 rounded-xl border-[0.5px] border-[#5fcf7e]/30 bg-[#5fcf7e]/10 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedArtwork} alt="Album artwork" className="size-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white/90">{form.title}</div>
                <div className="mt-0.5 text-xs text-[#5fcf7e]">
                  <Check size={10} className="mr-1 inline" />
                  Auto-filled from Apple Music · {form.genre}{form.releaseDate ? ` · ${form.releaseDate}` : ""}
                </div>
              </div>
            </div>
          )}

          {/* Title — always visible */}
          <div className="mt-4">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Song title (required)"
              className="w-full rounded-xl border-[0.5px] border-white/10 bg-white/5 px-4 py-3 text-white/90 text-sm outline-none transition focus:border-[#7c6fef]/50"
            />
          </div>

          {/* Add details — collapsed by default */}
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-xl border-[0.5px] border-white/8 bg-white/5 px-4 py-2.5 text-[12px] text-white/50 transition hover:bg-white/5"
          >
            <span>{showDetails ? "Hide details" : "Add details — ISRC, genre, mood, BPM, distributor"}</span>
            <span className="text-white/50">{showDetails ? "▲" : "▼"}</span>
          </button>

          {showDetails && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {/* ISRC with MB lookup */}
              <div className="sm:col-span-2">
                <label className="block text-sm text-white/60">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">ISRC</span>
                  <div className="relative">
                    <input
                      value={form.isrc}
                      onChange={e => handleIsrcChange(e.target.value)}
                      placeholder="US-ABC-24-00001 (auto-looks up MusicBrainz)"
                      className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50"
                    />
                    {mbLookup.status === "loading" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">Looking up…</span>
                    )}
                  </div>
                  {mbLookup.status === "found" && mbLookup.result && (
                    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border-[0.5px] border-[#5fcf7e]/50 bg-[#5fcf7e]/10 px-3 py-2 text-xs">
                      <span className="text-[#5fcf7e]">{mbLookup.result.title}{mbLookup.result.artist ? ` · ${mbLookup.result.artist}` : ""}</span>
                      <button type="button" onClick={applyMbResult} className="shrink-0 font-medium text-[#5fcf7e]">Use →</button>
                    </div>
                  )}
                </label>
              </div>

              {/* Rest of fields */}
              {([
                ["UPC", "upc", "196871234567", "text"],
                ["Release date", "releaseDate", "", "date"],
                ["Genre", "genre", "e.g. R&B", "text"],
                ["Mood", "mood", "e.g. Late night", "text"],
                ["BPM", "bpm", "e.g. 92", "number"],
                ["Key", "musicalKey", "e.g. A minor", "text"],
                ["Language", "language", "e.g. English", "text"],
                ["Territory", "territory", "e.g. United States", "text"],
              ] as const).map(([label, key, placeholder, type]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">{label}</span>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50"
                  />
                </label>
              ))}

              {/* Distributor */}
              <div className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-white/50">Distributor</span>
                <select
                  value={form.distributor}
                  onChange={e => setForm(f => ({ ...f, distributor: e.target.value }))}
                  className="w-full rounded-lg border-[0.5px] border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 outline-none transition focus:border-[#7c6fef]/50"
                >
                  {["", "DistroKid", "TuneCore", "CD Baby", "ONErpm", "UnitedMasters", "Amuse", "Stem", "Other", "Not sure yet"].map(item => (
                    <option key={item} value={item}>{item || "Select distributor…"}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* CTA */}
          {atFreeLimit ? (
            <div className="mt-5 rounded-xl border-[0.5px] border-[#ef9f27]/40 bg-[#faeeda] px-4 py-4 text-center">
              <p className="text-sm font-medium text-[#f0a832]">Free plan is capped at 3 songs.</p>
              <p className="mt-1 text-xs text-[#f0a832]/70">Upgrade to Pro to add unlimited releases and unlock the full action queue.</p>
              <a href="/settings" className="mt-3 inline-block rounded-lg bg-[#0a0a0a] px-5 py-2 text-sm font-medium text-white">
                Upgrade to Pro →
              </a>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={submitSong}
                disabled={!form.title.trim()}
                className="mt-5 w-full rounded-xl bg-[#0a0a0a] py-3.5 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-40"
              >
                {form.title.trim() ? `Add "${form.title}" to catalog →` : "Enter a song title to continue"}
              </button>
              <p className="mt-2 text-center text-[11px] text-white/50">
                You can add ISRC, genre, and splits from inside the song room after saving.
              </p>
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}
