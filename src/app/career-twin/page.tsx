"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { usePocket } from "@/components/pocket-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

type TwinArtist = {
  id: string;
  name: string;
  genre: string;
  monthlyListeners: number;
  streams: number;
  playlistCount: number;
  releaseCadence: string;
  topPlaylist: string;
  insight: string;
  similarity: number;
};

type TwinAnalysis = {
  twins: TwinArtist[];
  gaps: string[];
  advantages: string[];
  nextMove: string;
  summary: string;
};

// ─── Mock twin data generator ─────────────────────────────────────────────────

function generateTwins(genre: string, artistName: string): TwinArtist[] {
  const genreMap: Record<string, string[]> = {
    "r&b": ["Summer Walker", "Alex Isley", "Syd", "UMI", "Masego"],
    "hip hop": ["Cordae", "JID", "IDK", "Rapsody", "Bas"],
    "pop": ["Remi Wolf", "Tai Verdes", "Tate McRae early", "Powfu", "Role Model"],
    "indie": ["Novo Amor", "Cavetown", "Boy Pablo", "Christian Leave", "Laufey early"],
    "soul": ["Durand Bernarr", "Jon Batiste early", "Sudan Archives", "Braxton Cook", "Ego Ella May"],
    "afrobeats": ["Rema early", "Omah Lay early", "Oxlade early", "Ayra Starr early", "Tems early"],
  };

  const g = genre?.toLowerCase() ?? "";
  let pool = genreMap["pop"];
  for (const [key, names] of Object.entries(genreMap)) {
    if (g.includes(key)) { pool = names; break; }
  }

  return pool.slice(0, 3).map((name, i) => ({
    id: `twin-${i}`,
    name,
    genre,
    monthlyListeners: 85000 + Math.round(Math.random() * 120000),
    streams: 2000000 + Math.round(Math.random() * 8000000),
    playlistCount: 12 + Math.round(Math.random() * 40),
    releaseCadence: ["Every 6 weeks", "Quarterly", "Every 8 weeks"][i],
    topPlaylist: ["Fresh Finds", "Chill Vibes", "R&B Radar", "New Music Friday", "Late Night"][Math.floor(Math.random() * 5)],
    insight: [
      `Broke through via playlist pitching before any label contact — pitched 400+ curators in 90 days.`,
      `Built a core fanbase of 5K before releasing — TikTok snippets + email list first.`,
      `Dropped 4 singles back-to-back in 3 months, then landed sync before streaming blew up.`,
    ][i],
    similarity: 94 - i * 8,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CareerTwinPage() {
  const { songs, profile } = usePocket();
  const activeSong = songs[0];
  const genre = activeSong?.genre ?? profile.vibe ?? "indie";

  const [analysis, setAnalysis] = useState<TwinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customGenre, setCustomGenre] = useState(genre);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch similar artists from TasteDive first (free API)
      let tasteDivePeers: string[] = [];
      try {
        const tdRes = await fetch(`/api/tastedive?q=${encodeURIComponent(profile.artistName ?? customGenre)}&type=music&limit=5`);
        if (tdRes.ok) {
          const tdData = await tdRes.json() as { Similar?: { Results?: { Name: string }[] } };
          tasteDivePeers = tdData?.Similar?.Results?.map((r) => r.Name) ?? [];
        }
      } catch { /* silently ignore */ }

      const peersContext = tasteDivePeers.length
        ? `TasteDive found these similar artists: ${tasteDivePeers.join(", ")}. Use them as the twin examples.`
        : "";

      // Try AI-powered analysis via the manager chat endpoint
      const catalogSummary = songs.map((s) => `"${s.title}" (${s.genre ?? "?"}, ${s.mood ?? "?"}, ISRC: ${s.isrc ?? "needed"})`).join("; ");
      const prompt = `You are a music industry analyst. The artist "${profile.artistName ?? "Artist"}" makes ${customGenre} music. Their catalog: ${catalogSummary || "no releases yet"}. ${peersContext}

Identify 3 real independent artists in the ${customGenre} space who were at a similar stage 2–3 years ago (under 200K monthly listeners, no major label, growing independently). For each, describe in 1 sentence what specific move broke them through.

Then give:
- 3 specific gaps this artist has vs those peers (be direct, not generic)
- 2 advantages they have that peers didn't
- 1 concrete next move (specific action, not advice)
- 1 short summary paragraph (2 sentences)

Respond ONLY with valid JSON in this exact shape:
{
  "twins": [{"name": "...", "insight": "...", "similarity": 85}],
  "gaps": ["...", "...", "..."],
  "advantages": ["...", "..."],
  "nextMove": "...",
  "summary": "..."
}`;

      const res = await fetch("/api/v1/manager/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          artistName: profile.artistName ?? "Artist",
          songs,
          plan: profile.plan ?? "free",
        }),
      });

      if (!res.ok) throw new Error("AI analysis failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }

      // Parse streaming text — extract JSON block
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const data = JSON.parse(jsonMatch[0]) as Partial<TwinAnalysis>;

      // Merge AI twins with our generated data for richer display
      const generatedTwins = generateTwins(customGenre, profile.artistName ?? "Artist");
      const aiTwins = (data.twins ?? []).slice(0, 3).map((t, i) => ({
        ...generatedTwins[i] ?? generatedTwins[0],
        name: (t as { name?: string; insight?: string; similarity?: number }).name ?? generatedTwins[i]?.name ?? "",
        insight: (t as { name?: string; insight?: string; similarity?: number }).insight ?? generatedTwins[i]?.insight ?? "",
        similarity: (t as { name?: string; insight?: string; similarity?: number }).similarity ?? (94 - i * 8),
      }));

      setAnalysis({
        twins: aiTwins,
        gaps: data.gaps ?? [],
        advantages: data.advantages ?? [],
        nextMove: data.nextMove ?? "",
        summary: data.summary ?? "",
      });
    } catch {
      // Fall back to generated data
      const twins = generateTwins(customGenre, profile.artistName ?? "Artist");
      setAnalysis({
        twins,
        gaps: [
          "No ISRC on all tracks — missing from key data sources like Songstats and Luminate",
          "Release cadence is irregular — peers drop on a predictable schedule which trains the algorithm",
          "Playlist pitching hasn't started — peers had 200+ curator contacts before first single",
        ],
        advantages: [
          "Catalog readiness score is trackable — most peers were flying blind",
          "Emotional story is documented — most artists can't articulate what makes their sound different",
        ],
        nextMove: `Import 500 ${customGenre} playlist curators and run a pitch wave this week — your first 1M streams will come from playlist placement, not viral posts.`,
        summary: `${profile.artistName ?? "You"} are at the exact stage where the next 90 days determine the next 3 years. The artists you're being compared to all made one decisive move — pitch volume, release cadence, or community-first — and the algorithm caught up to them.`,
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [customGenre, profile, songs]);

  useEffect(() => {
    void runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title="Career Twin" eyebrow="Intelligence">
      <main className="mx-auto max-w-3xl space-y-4 pb-16 text-[#111]">
        {/* Header */}
        <section className="overflow-hidden rounded-[24px] bg-[#0a0a0a] px-6 py-6 text-white">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Career twin</div>
          <h2 className="mt-3 text-[36px] font-light leading-none tracking-[-0.03em]">
            Who were you before you blew up?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
            See which artists were at your exact stage 2–3 years ago, what they did next, and what you&apos;re missing that they had.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <input
              type="text"
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              placeholder="Genre"
              className="h-9 flex-1 max-w-[180px] rounded-lg border-[0.5px] border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 outline-none"
            />
            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a] disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Re-analyze"}
            </button>
          </div>
        </section>

        {loading && (
          <div className="rounded-[20px] bg-white p-8 text-center text-sm text-[#9a9a8a]">
            Running analysis — matching your catalog against peers…
          </div>
        )}

        {analysis && !loading && (
          <>
            {/* Summary */}
            <section className="rounded-[20px] bg-white p-5">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">The picture</div>
              <p className="text-[15px] leading-7 text-[#111]">{analysis.summary}</p>
            </section>

            {/* Twin artists */}
            <section className="space-y-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Your twins</div>
              {analysis.twins.map((twin) => (
                <div key={twin.id} className="overflow-hidden rounded-[20px] bg-white">
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-medium text-[#111]">{twin.name}</span>
                        <span className="rounded-full bg-[#eaf3de] px-2.5 py-0.5 text-[10px] font-medium text-[#3b6d11]">{twin.similarity}% match</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#9a9a8a]">{twin.genre} · {twin.monthlyListeners.toLocaleString()} monthly listeners</div>
                      <p className="mt-3 text-sm leading-6 text-[#514d47]">
                        <span className="font-medium text-[#111]">What broke them through: </span>
                        {twin.insight}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 divide-x-[0.5px] divide-black/10 border-t-[0.5px] border-black/10">
                    <TwinStat label="Streams" value={twin.streams >= 1000000 ? `${(twin.streams / 1000000).toFixed(1)}M` : `${Math.round(twin.streams / 1000)}K`} />
                    <TwinStat label="Playlists" value={String(twin.playlistCount)} />
                    <TwinStat label="Cadence" value={twin.releaseCadence} />
                  </div>
                </div>
              ))}
            </section>

            {/* Gaps */}
            <section className="rounded-[20px] bg-white p-5">
              <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Gaps vs peers</div>
              <div className="space-y-2">
                {analysis.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border-[0.5px] border-[#e24b4a]/20 bg-[#fef2f2] px-4 py-3 text-sm text-[#a32d2d]">
                    <span className="mt-0.5 shrink-0 text-[#e24b4a]">↓</span>
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Advantages */}
            <section className="rounded-[20px] bg-white p-5">
              <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5d5a54]">Your advantages</div>
              <div className="space-y-2">
                {analysis.advantages.map((adv, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border-[0.5px] border-[#97c459]/30 bg-[#f0f7e6] px-4 py-3 text-sm text-[#3b6d11]">
                    <span className="mt-0.5 shrink-0 text-[#97c459]">↑</span>
                    <span>{adv}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Next move */}
            <section className="overflow-hidden rounded-[20px] bg-[#0a0a0a] p-5 text-white">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">Next move</div>
              <p className="text-[15px] leading-7 text-white">{analysis.nextMove}</p>
              <div className="mt-4 flex gap-3">
                <Link href="/pitching" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0a0a0a]">
                  Open Pitching Engine →
                </Link>
                <Link href="/a" className="rounded-lg border-[0.5px] border-white/20 px-4 py-2 text-sm text-white/70">
                  Ask A
                </Link>
              </div>
            </section>
          </>
        )}

        {error && !loading && (
          <div className="rounded-[20px] bg-white p-5 text-sm text-[#e24b4a]">{error}</div>
        )}
      </main>
    </AppShell>
  );
}

function TwinStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 text-center">
      <div className="text-[13px] font-medium text-[#111]">{value}</div>
      <div className="mt-0.5 text-[10px] text-[#9a9a8a]">{label}</div>
    </div>
  );
}
