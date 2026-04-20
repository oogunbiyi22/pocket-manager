"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";
import { getSupabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type Curator = {
  id: string;
  name: string;
  email: string;
  playlistName: string;
  playlistType?: string;
  genre?: string;
  platform?: string;
  followers?: string;
  successRate?: string;
  notes?: string;
  fit?: number;
};

type PitchStatus = "idle" | "generating" | "ready" | "sending" | "sent" | "error";

type Pitch = {
  curatorId: string;
  subject: string;
  body: string;
  status: PitchStatus;
  error?: string;
  sentAt?: string;
};

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Curator[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\s"]/g, "").replace(/-/g, "_"));

  const find = (...keys: string[]) => (row: string[]) => {
    for (const k of keys) {
      const i = headers.indexOf(k);
      if (i !== -1 && row[i]?.trim()) return row[i].trim().replace(/^"|"$/g, "");
    }
    return "";
  };

  return lines.slice(1).map((line, idx) => {
    // Handle quoted fields with commas
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { row.push(current); current = ""; }
      else { current += char; }
    }
    row.push(current);

    const email = find("email", "curator_email", "contact", "contact_email")(row);
    if (!email || !email.includes("@")) return null;

    return {
      id: `csv-${idx}`,
      name: find("name", "curator_name", "curator", "contact_name")(row) || email.split("@")[0],
      email,
      playlistName: find("playlist", "playlist_name", "playlist name", "playlistname")(row) || "Unknown Playlist",
      playlistType: find("type", "playlist_type", "category")(row),
      genre: find("genre", "genres", "music_genre")(row),
      platform: find("platform", "dsp", "service")(row) || "Spotify",
      followers: find("followers", "follower_count", "subs", "subscribers")(row),
      successRate: find("success_rate", "success", "rate", "hit_rate")(row),
      notes: find("notes", "note", "comments", "comment")(row),
    } as Curator;
  }).filter(Boolean) as Curator[];
}

// ─── Fit scoring ──────────────────────────────────────────────────────────────

function scoreFit(curator: Curator, genre?: string, mood?: string): number {
  if (!genre && !mood) return 50;
  const g = genre?.toLowerCase() ?? "";
  const m = mood?.toLowerCase() ?? "";
  const cg = (curator.genre ?? "").toLowerCase();
  const cp = (curator.playlistType ?? "").toLowerCase();
  let score = 40;
  if (cg && g && (cg.includes(g.slice(0, 4)) || g.includes(cg.slice(0, 4)))) score += 35;
  else if (cg && g && g.split(/[/,\s&]+/).some((part) => part.trim() && cg.includes(part.trim()))) score += 18;
  if (cp && m && (cp.includes(m.slice(0, 5)) || m.includes(cp.slice(0, 5)))) score += 20;
  return Math.min(99, score);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PitchingPage() {
  const { songs, profile } = usePocket();
  const [songId, setSongId] = useState(songs[0]?.id ?? "");
  const [curators, setCurators] = useState<Curator[]>([]);
  const [pitches, setPitches] = useState<Record<string, Pitch>>({});
  const [emotionalStory, setEmotionalStory] = useState("");
  const [artistContact, setArtistContact] = useState(profile.email ?? "");
  const [tab, setTab] = useState<"import" | "curators" | "pitches">("import");
  const [importing, setImporting] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const activeSong = songs.find((s) => s.id === songId) ?? songs[0];

  // Score all curators against current song
  const scoredCurators = useMemo(() =>
    curators
      .map((c) => ({ ...c, fit: scoreFit(c, activeSong?.genre, activeSong?.mood) }))
      .sort((a, b) => b.fit - a.fit),
    [curators, activeSong],
  );

  const selectedCurators = scoredCurators.filter((c) => selectedIds.has(c.id));
  const readyCount = Object.values(pitches).filter((p) => p.status === "ready" || p.status === "sent").length;
  const sentCount = Object.values(pitches).filter((p) => p.status === "sent").length;

  // ── CSV Import ──────────────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setCurators(parsed);
      setSelectedIds(new Set(parsed.slice(0, 50).map((c) => c.id)));
      setTab("curators");
    } catch {
      alert("Could not parse CSV. Make sure it has a header row with email, name, and playlist columns.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, []);

  // ── Generate single pitch ────────────────────────────────────────────────────

  const generatePitch = useCallback(async (curator: Curator) => {
    if (!activeSong) return;
    setPitches((prev) => ({ ...prev, [curator.id]: { curatorId: curator.id, subject: "", body: "", status: "generating" } }));

    try {
      const supabase = getSupabase();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;

      const res = await fetch("/api/pitch/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          artistName: profile.artistName ?? "Artist",
          artistContact,
          emotionalStory: emotionalStory || activeSong.emotionalStory,
          song: {
            title: activeSong.title,
            genre: activeSong.genre,
            mood: activeSong.mood,
            bpm: activeSong.bpm,
            musicalKey: activeSong.musicalKey,
            releaseDate: activeSong.releaseDate,
            isrc: activeSong.isrc,
          },
          curator,
          plan: profile.plan ?? "free",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "error", error: err.error } }));
        return;
      }

      const data = await res.json();
      setPitches((prev) => ({
        ...prev,
        [curator.id]: { curatorId: curator.id, subject: data.subject, body: data.body, status: "ready" },
      }));
    } catch {
      setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "error", error: "Network error" } }));
    }
  }, [activeSong, artistContact, emotionalStory, profile]);

  // ── Generate all selected ────────────────────────────────────────────────────

  const generateAll = useCallback(async () => {
    setGeneratingAll(true);
    const toGenerate = selectedCurators.filter((c) => !pitches[c.id] || pitches[c.id].status === "error");
    for (const curator of toGenerate) {
      await generatePitch(curator);
      await new Promise((r) => setTimeout(r, 400)); // stagger requests
    }
    setGeneratingAll(false);
    setTab("pitches");
  }, [selectedCurators, pitches, generatePitch]);

  // ── Send single pitch ────────────────────────────────────────────────────────

  const sendPitch = useCallback(async (curator: Curator) => {
    const pitch = pitches[curator.id];
    if (!pitch || pitch.status !== "ready") return;

    setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "sending" } }));

    try {
      const res = await fetch("/api/pitch/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: curator.email,
          subject: pitch.subject,
          body: pitch.body,
          replyTo: artistContact || undefined,
        }),
      });

      const data = await res.json();

      if (data.method === "mailto") {
        // Open in mail client as fallback
        const mailtoUrl = `mailto:${curator.email}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`;
        window.open(mailtoUrl);
        setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "sent", sentAt: new Date().toISOString() } }));
      } else if (data.ok) {
        setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "sent", sentAt: new Date().toISOString() } }));
      } else {
        setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "error", error: data.error } }));
      }
    } catch {
      setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], status: "error", error: "Send failed" } }));
    }
  }, [pitches, artistContact]);

  // ── Send all ready ────────────────────────────────────────────────────────────

  const sendAll = useCallback(async () => {
    setSendingAll(true);
    const toSend = selectedCurators.filter((c) => pitches[c.id]?.status === "ready");
    for (const curator of toSend) {
      await sendPitch(curator);
      await new Promise((r) => setTimeout(r, 300));
    }
    setSendingAll(false);
  }, [selectedCurators, pitches, sendPitch]);

  // ── Toggle curator selection ──────────────────────────────────────────────────

  function toggleCurator(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() { setSelectedIds(new Set(scoredCurators.map((c) => c.id))); }
  function selectTop50() { setSelectedIds(new Set(scoredCurators.slice(0, 50).map((c) => c.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <AppShell title="Playlist Pitching Engine" eyebrow="Signal">
      <main className="mx-auto max-w-6xl overflow-hidden rounded-[24px] border-[0.5px] border-black/15 bg-[#f5f4f0] text-[#111]">

        {/* Hero */}
        <section className="bg-[#0a0a0a] px-5 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">Outreach OS</div>
          <h2 className="mt-3 text-[40px] font-light leading-none tracking-[-0.03em]">
            Pitch thousands of curators.<br />One emotional story. Infinite reach.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Import your curator spreadsheet, tell us how you felt making the song, and we generate + send personalized pitches in your exact voice — without you touching Gmail.
          </p>
          {curators.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
              <span className="rounded-full bg-white/10 px-3 py-1">{curators.length} curators loaded</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{selectedIds.size} selected</span>
              <span className="rounded-full bg-[#97c459]/20 px-3 py-1 text-[#97c459]">{readyCount} pitches ready</span>
              <span className="rounded-full bg-[#ef9f27]/20 px-3 py-1 text-[#ef9f27]">{sentCount} sent</span>
            </div>
          )}
        </section>

        {/* Tabs */}
        <div className="flex border-b-[0.5px] border-black/10 bg-white">
          {([
            ["import", "1. Setup"],
            ["curators", `2. Curators${curators.length > 0 ? ` (${curators.length})` : ""}`],
            ["pitches", `3. Pitches${readyCount > 0 ? ` (${readyCount})` : ""}`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-5 py-3 text-[12px] font-medium transition ${tab === key ? "border-b-2 border-[#0a0a0a] text-[#111]" : "text-[#9a9a8a] hover:text-[#111]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Setup ───────────────────────────────────────────────────── */}
        {tab === "import" && (
          <section className="grid gap-5 p-5 lg:grid-cols-2">
            {/* Song selector */}
            <div className="space-y-4">
              <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Song to pitch</div>
                {songs.length === 0 ? (
                  <p className="mt-3 text-sm text-[#9a9a8a]">
                    <Link href="/projects/new" className="underline">Add a release</Link> first.
                  </p>
                ) : (
                  <select
                    value={songId}
                    onChange={(e) => setSongId(e.target.value)}
                    className="mt-3 h-12 w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-3 text-sm text-[#111] outline-none"
                  >
                    {songs.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                )}
                {activeSong && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    {[
                      ["Genre", activeSong.genre],
                      ["Mood", activeSong.mood],
                      ["ISRC", activeSong.isrc],
                    ].map(([label, val]) => (
                      <div key={label} className="rounded-lg bg-[#f8f6f1] px-2 py-1.5">
                        <div className="text-[#9a9a8a]">{label}</div>
                        <div className={`mt-0.5 truncate font-medium ${val ? "text-[#111]" : "text-[#e24b4a]"}`}>{val ?? "missing"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emotional story */}
              <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Emotional story</div>
                <p className="mt-2 text-[11px] leading-5 text-[#9a9a8a]">
                  How did you feel when you made this song? Write it raw. This becomes the DNA of every pitch — written in your exact voice.
                </p>
                <textarea
                  value={emotionalStory || activeSong?.emotionalStory || ""}
                  onChange={(e) => setEmotionalStory(e.target.value)}
                  placeholder="e.g. I made this at 3am after a conversation I wasn't supposed to have. The beat felt like the moment right before you say something you can't take back..."
                  rows={5}
                  className="mt-3 w-full rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm leading-6 text-[#111] outline-none placeholder:text-[#b0b0a8] focus:border-black/30"
                />
              </div>

              <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Your reply-to email</div>
                <input
                  value={artistContact}
                  onChange={(e) => setArtistContact(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className="mt-3 h-11 w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-3 text-sm text-[#111] outline-none focus:border-black/30"
                />
              </div>
            </div>

            {/* CSV import */}
            <div className="space-y-4">
              <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Import curator list</div>
                <p className="mt-2 text-[11px] leading-5 text-[#9a9a8a]">
                  Export your Google Sheet as CSV (File → Download → CSV). Your sheet should have columns for: <strong>email, name, playlist, genre, platform, followers</strong>. Extra columns (notes, success_rate, type) are picked up automatically.
                </p>

                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed border-black/15 bg-[#f8f6f1] py-10 transition hover:border-black/30">
                  <div className="text-3xl">📄</div>
                  <div className="text-sm font-medium text-[#111]">
                    {importing ? "Parsing…" : "Drop CSV or click to upload"}
                  </div>
                  <div className="text-[11px] text-[#9a9a8a]">Supports any spreadsheet exported as CSV</div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                {curators.length > 0 && (
                  <div className="mt-3 rounded-xl bg-[#eaf3de] px-4 py-3 text-sm text-[#3b6d11]">
                    ✓ {curators.length} curators imported · {curators.filter((c) => c.email.includes("@")).length} valid emails
                  </div>
                )}
              </div>

              <div className="rounded-xl border-[0.5px] border-black/15 bg-white p-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Expected CSV columns</div>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {[
                    ["email", "required"],
                    ["name", "required"],
                    ["playlist", "required"],
                    ["genre", "recommended"],
                    ["platform", "recommended"],
                    ["followers", "optional"],
                    ["type", "optional"],
                    ["success_rate", "optional"],
                    ["notes", "optional"],
                  ].map(([col, req]) => (
                    <div key={col} className="flex items-center justify-between rounded-lg bg-[#f8f6f1] px-2.5 py-1.5">
                      <code className="text-[11px] text-[#111]">{col}</code>
                      <span className={`text-[10px] ${req === "required" ? "text-[#e24b4a]" : req === "recommended" ? "text-[#854f0b]" : "text-[#9a9a8a]"}`}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {curators.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTab("curators")}
                  className="w-full rounded-xl bg-[#0a0a0a] py-3.5 text-sm font-medium text-white transition active:scale-95"
                >
                  Review {curators.length} curators →
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Tab 2: Curators ────────────────────────────────────────────────── */}
        {tab === "curators" && (
          <section className="p-5">
            {curators.length === 0 ? (
              <div className="rounded-xl border-[0.5px] border-dashed border-black/15 py-16 text-center text-sm text-[#9a9a8a]">
                <div className="text-3xl">📋</div>
                <div className="mt-3">No curators yet.</div>
                <button type="button" onClick={() => setTab("import")} className="mt-3 text-[#854f0b] underline underline-offset-2">Import your CSV →</button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#111]">
                      {scoredCurators.length} curators · sorted by fit for &ldquo;{activeSong?.title}&rdquo;
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9a9a8a]">{selectedIds.size} selected for pitching</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectTop50} className="rounded-lg border-[0.5px] border-black/15 px-3 py-1.5 text-[12px] text-[#111] hover:bg-[#f5f4f0]">Top 50</button>
                    <button type="button" onClick={selectAll} className="rounded-lg border-[0.5px] border-black/15 px-3 py-1.5 text-[12px] text-[#111] hover:bg-[#f5f4f0]">All</button>
                    <button type="button" onClick={clearSelection} className="rounded-lg border-[0.5px] border-black/15 px-3 py-1.5 text-[12px] text-[#9a9a8a] hover:bg-[#f5f4f0]">Clear</button>
                    <button
                      type="button"
                      onClick={generateAll}
                      disabled={generatingAll || selectedIds.size === 0}
                      className="rounded-lg bg-[#0a0a0a] px-4 py-1.5 text-[12px] font-medium text-white transition disabled:opacity-40 active:scale-95"
                    >
                      {generatingAll ? "Generating…" : `Generate ${selectedIds.size} pitches →`}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {scoredCurators.map((curator) => {
                    const pitch = pitches[curator.id];
                    const isSelected = selectedIds.has(curator.id);
                    return (
                      <div
                        key={curator.id}
                        className={`flex items-center gap-3 rounded-xl border-[0.5px] px-4 py-3 transition ${isSelected ? "border-black/20 bg-white" : "border-black/8 bg-[#f8f6f1] opacity-60"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCurator(curator.id)}
                          className="h-4 w-4 shrink-0 accent-[#0a0a0a]"
                        />
                        <div className="flex w-10 flex-col items-center shrink-0">
                          <div className="text-[13px] font-medium text-[#111]">{curator.fit ?? 50}</div>
                          <div className="text-[9px] text-[#9a9a8a]">fit</div>
                        </div>
                        <div className="h-7 w-px bg-black/[0.06] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-medium text-[#111] truncate">{curator.playlistName}</span>
                            {curator.platform && (
                              <span className="rounded-full border-[0.5px] border-black/10 px-2 py-0.5 text-[10px] text-[#6b6b65]">{curator.platform}</span>
                            )}
                            {curator.genre && (
                              <span className="rounded-full bg-[#f0efe8] px-2 py-0.5 text-[10px] text-[#514d47]">{curator.genre}</span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#9a9a8a] truncate">
                            {curator.name} · {curator.email}
                            {curator.followers ? ` · ${curator.followers} followers` : ""}
                          </div>
                        </div>
                        {pitch && (
                          <div className="shrink-0">
                            {pitch.status === "generating" && <span className="text-[11px] text-[#9a9a8a]">writing…</span>}
                            {pitch.status === "ready" && <span className="rounded-full bg-[#eaf3de] px-2 py-0.5 text-[10px] text-[#3b6d11]">Ready</span>}
                            {pitch.status === "sent" && <span className="rounded-full bg-[#0a0a0a] px-2 py-0.5 text-[10px] text-white">Sent ✓</span>}
                            {pitch.status === "error" && <span className="rounded-full bg-[#fcebeb] px-2 py-0.5 text-[10px] text-[#a32d2d]">Error</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Tab 3: Pitches ─────────────────────────────────────────────────── */}
        {tab === "pitches" && (
          <section className="p-5">
            {readyCount === 0 ? (
              <div className="rounded-xl border-[0.5px] border-dashed border-black/15 py-16 text-center text-sm text-[#9a9a8a]">
                <div className="text-3xl">✉️</div>
                <div className="mt-3">No pitches generated yet.</div>
                <button type="button" onClick={() => setTab("curators")} className="mt-3 text-[#854f0b] underline underline-offset-2">
                  Select curators and generate →
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#111]">{readyCount} pitches ready · {sentCount} sent</div>
                    <div className="mt-0.5 text-[11px] text-[#9a9a8a]">Review each pitch before sending, or send all at once.</div>
                  </div>
                  <button
                    type="button"
                    onClick={sendAll}
                    disabled={sendingAll || selectedCurators.filter((c) => pitches[c.id]?.status === "ready").length === 0}
                    className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40 active:scale-95"
                  >
                    {sendingAll ? "Sending…" : `Send all ready (${selectedCurators.filter((c) => pitches[c.id]?.status === "ready").length})`}
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedCurators
                    .filter((c) => pitches[c.id])
                    .map((curator) => {
                      const pitch = pitches[curator.id];
                      return (
                        <PitchCard
                          key={curator.id}
                          curator={curator}
                          pitch={pitch}
                          onSend={() => sendPitch(curator)}
                          onRegenerate={() => generatePitch(curator)}
                          onEdit={(field, value) =>
                            setPitches((prev) => ({ ...prev, [curator.id]: { ...prev[curator.id], [field]: value } }))
                          }
                        />
                      );
                    })}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}

// ─── Pitch Card ───────────────────────────────────────────────────────────────

function PitchCard({
  curator,
  pitch,
  onSend,
  onRegenerate,
  onEdit,
}: {
  curator: Curator;
  pitch: Pitch;
  onSend: () => void;
  onRegenerate: () => void;
  onEdit: (field: "subject" | "body", value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel = {
    idle: null,
    generating: <span className="text-[11px] text-[#9a9a8a]">Generating…</span>,
    ready: <span className="rounded-full bg-[#eaf3de] px-2 py-0.5 text-[10px] text-[#3b6d11]">Ready to send</span>,
    sending: <span className="text-[11px] text-[#9a9a8a]">Sending…</span>,
    sent: <span className="rounded-full bg-[#0a0a0a] px-2 py-0.5 text-[10px] text-white">Sent ✓</span>,
    error: <span className="rounded-full bg-[#fcebeb] px-2 py-0.5 text-[10px] text-[#a32d2d]">{pitch.error ?? "Error"}</span>,
  }[pitch.status];

  return (
    <div className="overflow-hidden rounded-xl border-[0.5px] border-black/15 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8f6f1] transition"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-[#111] truncate">{curator.name}</span>
            <span className="text-[11px] text-[#9a9a8a] truncate">{curator.playlistName}</span>
          </div>
          {pitch.subject && (
            <div className="mt-0.5 truncate text-[11px] text-[#6b6b65]">Subj: {pitch.subject}</div>
          )}
        </div>
        {statusLabel}
        <span className="shrink-0 text-[#9a9a8a]">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t-[0.5px] border-black/8 p-4 space-y-3">
          <label className="block">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9a9a8a]">Subject</div>
            <input
              value={pitch.subject}
              onChange={(e) => onEdit("subject", e.target.value)}
              disabled={pitch.status === "sent"}
              className="h-10 w-full rounded-lg border-[0.5px] border-black/15 bg-[#f8f6f1] px-3 text-sm text-[#111] outline-none focus:border-black/30 disabled:opacity-50"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9a9a8a]">Body</div>
            <textarea
              value={pitch.body}
              onChange={(e) => onEdit("body", e.target.value)}
              disabled={pitch.status === "sent"}
              rows={8}
              className="w-full rounded-xl border-[0.5px] border-black/15 bg-[#f8f6f1] px-4 py-3 text-sm leading-6 text-[#111] outline-none focus:border-black/30 disabled:opacity-50"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {pitch.status !== "sent" && (
              <button
                type="button"
                onClick={onSend}
                disabled={pitch.status === "sending" || pitch.status === "generating"}
                className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40 active:scale-95"
              >
                {pitch.status === "sending" ? "Sending…" : `Send to ${curator.email}`}
              </button>
            )}
            <button
              type="button"
              onClick={onRegenerate}
              className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#111] hover:bg-[#f5f4f0] transition"
            >
              Regenerate
            </button>
            <a
              href={`mailto:${curator.email}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`}
              className="rounded-lg border-[0.5px] border-black/15 px-4 py-2 text-sm text-[#514d47] hover:bg-[#f5f4f0] transition"
            >
              Open in Mail
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
